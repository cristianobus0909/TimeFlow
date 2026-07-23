import { User, IUser } from '../users/user.model';

export class AuthRepository {
  public async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  public async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  public async findByRefreshToken(token: string): Promise<IUser | null> {
    return User.findOne({ refreshToken: token });
  }

  public async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  public async save(user: IUser): Promise<IUser> {
    return user.save();
  }
}
export default AuthRepository;
