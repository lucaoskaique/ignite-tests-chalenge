import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../authenticateUser/AuthenticateUserUseCase";
import { IAuthenticateUserResponseDTO } from "../authenticateUser/IAuthenticateUserResponseDTO";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let usersRepositoryInMemory : InMemoryUsersRepository
let showUserProfileUseCase : ShowUserProfileUseCase
let createUserUseCase : CreateUserUseCase
let authenticateUserUseCase: AuthenticateUserUseCase;

describe('Show User Profile', () => {
  beforeEach(() => {
    usersRepositoryInMemory = new InMemoryUsersRepository()
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepositoryInMemory)
    createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepositoryInMemory)
  })

  it('should be able to show user profile', async () => {
    const userTest: ICreateUserDTO = {
      name: "User Test",
      email: "test@mail.com",
      password: "1234",
    };

    await createUserUseCase.execute(userTest);

    const {token, user} : IAuthenticateUserResponseDTO = await authenticateUserUseCase.execute({
      email: userTest.email,
      password: userTest.password,
    });

    const userShowed = await showUserProfileUseCase.execute(user.id as string);

    expect(userShowed).toHaveProperty('id');
  });

  it('should not be able to show user profile of a non-existent user', () => {
    expect(async () => {
      await showUserProfileUseCase.execute('non-existent-user-id');
    }).rejects.toBeInstanceOf(ShowUserProfileError);
  })
});