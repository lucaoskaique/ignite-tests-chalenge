import { User } from "../../entities/User";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";

let createUserUseCase : CreateUserUseCase
let usersRepositoryInMemory : InMemoryUsersRepository

describe("Create User", () => {
  beforeEach(() => {
      usersRepositoryInMemory = new InMemoryUsersRepository()
      createUserUseCase = new CreateUserUseCase(usersRepositoryInMemory)
  })

  it("should be able to create a new user", async () => {
    const user: ICreateUserDTO = {
      name: "User Test",
      email: "test@mail.com",
      password: "1234",
    };

    const userCreated =  await createUserUseCase.execute(user);

    expect(userCreated).toHaveProperty("id");
    expect(userCreated.name).toEqual(user.name);
    expect(userCreated.email).toEqual(user.email);
  });

  it("should not be able to create a new user with an existing email", () => {
    expect(async () => {
      const user: ICreateUserDTO = {
        name: "User Test",
        email: "test@mail.com",
        password: "1234",
      };
      await createUserUseCase.execute(user);

      await createUserUseCase.execute({
        name: "Second User Test",
        email: "test@mail.com",
        password: "4321",
      });
    }).rejects.toBeInstanceOf(CreateUserError);
  });
});