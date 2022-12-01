import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetBalanceUseCase } from "../getBalance/GetBalanceUseCase";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;
let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

describe('Get Statement Operation', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository,
    );
  });

  it('should be able to get statement operation', async () => {
    const user: ICreateUserDTO = {
      name: 'User Test',
      email: "test@mail.com",
      password: '1234',
    };
    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });
    
    const statement: ICreateStatementDTO = {
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: 'Deposit test',
    };

    const result = await inMemoryStatementsRepository.create(statement);

    const statementOperation = await getStatementOperationUseCase.execute({
      user_id: token.user.id as string,
      statement_id: result.id as string,
    });
    
    expect(statementOperation).toHaveProperty('id');
    expect(statementOperation.amount).toEqual(100);
  });

  it('should not be able to get statement operation from a non-existent user', async () => {
    expect(async () => {
      await getStatementOperationUseCase.execute({
        user_id: "non-existent",
        statement_id: "non-existent",
      });
    }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound);
  });

  it('should not be able to get statement operation from a non-existent statement', async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: 'User Test',
        email: "test@mail.com",
        password: '1234',
      };

      await createUserUseCase.execute(user);

      const token = await authenticateUserUseCase.execute({
        email: user.email,
        password: user.password,
      });

      await getStatementOperationUseCase.execute({
        user_id: token.user.id as string,
        statement_id: "non-existent",
      });

    }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound);
  });
  
});