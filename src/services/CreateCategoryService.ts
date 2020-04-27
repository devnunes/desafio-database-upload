// import AppError from '../errors/AppError';\
import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  category: string;
}

class CreateCategoryService {
  public async execute({ category }: Request): Promise<Category> {
    const categoriesRepository = getRepository(Category);

    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (categoryExists) {
      return categoryExists;
    }

    const newCategory = categoriesRepository.create({ title: category });
    await categoriesRepository.save(newCategory);

    return newCategory;
  }
}

export default CreateCategoryService;
