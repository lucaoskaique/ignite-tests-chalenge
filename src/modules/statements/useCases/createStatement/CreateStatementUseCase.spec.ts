import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";
import { OperationType } from '../../entities/Statement';
import { CreateStatementError } from "./CreateStatementError";
import { IncorrectEmailOrPasswordError } from "../../../users/useCases/authenticateUser/IncorrectEmailOrPasswordError";

let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe('Create Statement', () => {

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository();
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository,
    );
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository,
    );
  });

  it('should be able to create a new deposit statement', async () => {
    const user: ICreateUserDTO = {
      name: "User Test",
      email: "test@mail.com",
      password: "1234"
    }
    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password
    });

    const statement: ICreateStatementDTO = {
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Deposit test"
    }

    const result = await createStatementUseCase.execute(statement);

    expect(result).toHaveProperty("id");
    expect(statement.amount).toEqual(100);
  });

  it('should be able to create a new withdraw statement', async () => {
    const user: ICreateUserDTO = {
      name: "User Test",
      email: "test@mail.com",
      password: "1234"
    }
    await createUserUseCase.execute(user);

    const token = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password
    });

    await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Deposit test"
    });

    const withdraw = await createStatementUseCase.execute({
      user_id: token.user.id as string,
      type: OperationType.WITHDRAW,
      amount: 50,
      description: "Withdraw test"
    });

    expect(withdraw).toHaveProperty("id");
    expect(withdraw.amount).toEqual(50);
  });

  it('should not be able to create a withdraw when user has insufficient funds', async () => {
    const user = await createUserUseCase.execute({
      name: 'User Test',
      email: 'user@test.com',
      password: 'password',
    });

    await createStatementUseCase.execute({
      user_id: user.id as string,
      type: OperationType.DEPOSIT,
      amount: 50,
      description: 'Depositing $50',
    });

    await expect(
      createStatementUseCase.execute({
        user_id: user.id as string,
        type: OperationType.WITHDRAW,
        amount: 100,
        description: 'Withdrawing $100',
      }),
    ).rejects.toEqual(new CreateStatementError.InsufficientFunds());
  });

  it('should not be able to create a new statement with a non-existent user', async () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: "User Test",
        email: "test@mail.com",
        password: "1234"
      }
      await createUserUseCase.execute(user);

      const token = await authenticateUserUseCase.execute({
        email: user.email,
        password: user.password
      });

      await createStatementUseCase.execute({
        user_id: token.user.id as string,
        type: OperationType.DEPOSIT,
        amount: 100,
        description: "Deposit test"
      });

      await createStatementUseCase.execute({
        user_id: "non-existent-user",
        type: OperationType.WITHDRAW,
        amount: 50,
        description: "Withdraw test"
      });
    }).rejects.toBeInstanceOf(CreateStatementError.UserNotFound);
  });
});