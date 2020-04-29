import { getCustomRepository } from 'typeorm';
import { isUuid } from 'uuidv4';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<any> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const validateId = isUuid(id);
    if (!validateId) {
      throw new AppError('Id invalid', 401);
    }
    const transaction = await transactionsRepository.findOne(id);

    if (!transaction) {
      throw new AppError('Id invalid', 401);
    }

    return transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
