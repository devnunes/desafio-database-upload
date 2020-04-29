import fs from 'fs';
import csvParse from 'csv-parse';
import path from 'path';
import { getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  filename: string;
}

interface TransactionCsv {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  public async execute({ filename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getRepository(Transaction);
    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: TransactionCsv[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value) return;
      transactions.push({ title, type, value, category });
      categories.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const existentCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const categoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );
    const addCategorytitles = categories
      .filter(category => !categoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategorytitles.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(createdTransactions);
    fs.promises.unlink(csvFilePath);
    return createdTransactions;
  }
}

export default ImportTransactionsService;
