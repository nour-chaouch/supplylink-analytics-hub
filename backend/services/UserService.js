const ElasticsearchService = require('./ElasticsearchService');
const bcrypt = require('bcryptjs');

class UserService extends ElasticsearchService {
  constructor() {
    super('users');
  }

  // Create user with password hashing
  async createUser(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.create(user);
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email) {
    try {
      const users = await this.search('', ['email'], { email });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error.message);
      throw error;
    }
  }

  // Verify password
  async verifyPassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Error verifying password:', error.message);
      throw error;
    }
  }

  // Update user password
  async updatePassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      return await this.update(userId, { password: hashedPassword });
    } catch (error) {
      console.error('Error updating password:', error.message);
      throw error;
    }
  }

  // Get users with pagination
  async getUsers(page = 1, limit = 50, filters = {}) {
    try {
      const from = (page - 1) * limit;
      const users = await this.find({
        query: { match_all: {} },
        from: from,
        size: limit,
        sort: [{ createdAt: { order: 'desc' } }]
      });

      const total = await this.count();

      return {
        users: users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting users:', error.message);
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm, filters = {}) {
    try {
      const searchFields = ['name', 'email', 'company', 'bio'];
      const users = await this.search(searchTerm, searchFields, filters);
      
      return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      console.error('Error searching users:', error.message);
      throw error;
    }
  }
}

module.exports = UserService;

