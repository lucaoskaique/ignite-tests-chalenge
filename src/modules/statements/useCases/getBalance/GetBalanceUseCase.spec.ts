import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let inMemoryStatementsRepository: InMemoryStatementsRepository;
let getBalanceUseCase: GetBalanceUseCase;
let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

describe('Get Balance', () => {  
    beforeEach(() => {
      inMemoryUsersRepository = new InMemoryUsersRepository();
      inMemoryStatementsRepository = new InMemoryStatementsRepository();
      getBalanceUseCase = new GetBalanceUseCase(
        inMemoryStatementsRepository,
        inMemoryUsersRepository,
      );
      createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
      authenticateUserUseCase = new AuthenticateUserUseCase(
        inMemoryUsersRepository,
      );
    });
  
    it('should be able to get balance', async () => {
      const user: ICreateUserDTO = {
        name: "User Test",
        email: "",
        password: "1234"
      }
      await createUserUseCase.execute(user);

      const token = await authenticateUserUseCase.execute({
        email: user.email,
        password: user.password
      });
      
      const result = await getBalanceUseCase.execute({
        user_id: token.user.id as string
      });
      
      expect(result).toHaveProperty("balance");
      expect(result.balance).toEqual(0);
    });

    it('should not be able to get balance of a non-existent user', async () => {
      await expect(async () => {
        await getBalanceUseCase.execute({
          user_id: "non-existent"
        });
      }).rejects.toBeInstanceOf(GetBalanceError);
    });

    it('should be able to get balance with statement', async () => {
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

      const statement = await inMemoryStatementsRepository.create({
        user_id: token.user.id as string,
        type: "deposit" as any,
        amount: 100,
        description: "Test"
      });

      const result = await getBalanceUseCase.execute({
        user_id: token.user.id as string
      });

      expect(result).toHaveProperty("balance");
      expect(result.balance).toEqual(100);
    });
  });