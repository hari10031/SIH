// Mock user service - Replace with actual database implementation
class UserService {
  constructor() {
    // In-memory storage for demo purposes
    // Replace with actual database (MongoDB, PostgreSQL, etc.)
    this.users = new Map();
    this.userIdCounter = 1;
  }

  // Create new user
  async create(userData) {
    const id = this.userIdCounter++;
    const user = {
      id: id.toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id.toString(), user);
    return user;
  }

  // Find user by email
  async findByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email && !user.deletedAt) {
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  // Find user by email with password
  async findByEmailWithPassword(email) {
    for (const user of this.users.values()) {
      if (user.email === email && !user.deletedAt) {
        return user;
      }
    }
    return null;
  }

  // Find user by phone
  async findByPhone(phone) {
    for (const user of this.users.values()) {
      if (user.phone === phone && !user.deletedAt) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  // Find user by ID
  async findById(id) {
    const user = this.users.get(id);
    if (user && !user.deletedAt) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  // Find user by ID with password
  async findByIdWithPassword(id) {
    const user = this.users.get(id);
    return (user && !user.deletedAt) ? user : null;
  }

  // Update user by ID
  async updateById(id, updates) {
    const user = this.users.get(id);
    if (user && !user.deletedAt) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    }
    return null;
  }

  // Update refresh token
  async updateRefreshToken(id, refreshToken) {
    return this.updateById(id, { refreshToken });
  }

  // Update last login
  async updateLastLogin(id) {
    return this.updateById(id, { lastLogin: new Date() });
  }

  // Update email verification
  async updateEmailVerification(id, isVerified) {
    return this.updateById(id, { isEmailVerified: isVerified });
  }

  // Update phone verification
  async updatePhoneVerification(id, isVerified) {
    return this.updateById(id, { isPhoneVerified: isVerified });
  }

  // Update email verification token
  async updateEmailVerificationToken(id, token) {
    return this.updateById(id, { emailVerificationToken: token });
  }

  // Find by email verification token
  async findByEmailVerificationToken(token) {
    for (const user of this.users.values()) {
      if (user.emailVerificationToken === token && !user.deletedAt) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  // Clear email verification token
  async clearEmailVerificationToken(id) {
    return this.updateById(id, { 
      emailVerificationToken: null,
      emailVerificationExpiry: null 
    });
  }

  // Update password reset token
  async updatePasswordResetToken(id, token, expiry) {
    return this.updateById(id, { 
      passwordResetToken: token,
      passwordResetExpiry: expiry 
    });
  }

  // Find by password reset token
  async findByPasswordResetToken(token) {
    for (const user of this.users.values()) {
      if (user.passwordResetToken === token && !user.deletedAt) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    }
    return null;
  }

  // Clear password reset token
  async clearPasswordResetToken(id) {
    return this.updateById(id, { 
      passwordResetToken: null,
      passwordResetExpiry: null 
    });
  }

  // Update password
  async updatePassword(id, hashedPassword) {
    return this.updateById(id, { password: hashedPassword });
  }

  // Get all users with pagination
  async getAllUsers(options) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    let users = Array.from(this.users.values())
      .filter(user => !user.deletedAt)
      .map(user => {
        const { password, refreshToken, ...userWithoutSensitiveData } = user;
        return userWithoutSensitiveData;
      });

    // Sort users
    users.sort((a, b) => {
      const order = sortOrder === 'desc' ? -1 : 1;
      if (a[sortBy] < b[sortBy]) return -1 * order;
      if (a[sortBy] > b[sortBy]) return 1 * order;
      return 0;
    });

    // Pagination
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    users = users.slice(startIndex, endIndex);

    return {
      users,
      currentPage: page,
      totalPages,
      totalUsers,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Search users
  async searchUsers(options) {
    const { query, page = 1, limit = 10 } = options;
    
    let users = Array.from(this.users.values())
      .filter(user => !user.deletedAt)
      .filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.phone.includes(query)
      )
      .map(user => {
        const { password, refreshToken, ...userWithoutSensitiveData } = user;
        return userWithoutSensitiveData;
      });

    // Pagination
    const totalResults = users.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    users = users.slice(startIndex, endIndex);

    return {
      users,
      currentPage: page,
      totalPages,
      totalResults,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Get user statistics
  async getUserStats() {
    const users = Array.from(this.users.values()).filter(user => !user.deletedAt);
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.status === 'active').length,
      blockedUsers: users.filter(user => user.status === 'blocked').length,
      verifiedUsers: users.filter(user => user.isEmailVerified && user.isPhoneVerified).length,
      newUsersThisMonth: users.filter(user => user.createdAt >= thisMonth).length,
      userGrowth: '5%', // Mock data
      roleDistribution: {
        admin: users.filter(user => user.role === 'admin').length,
        user: users.filter(user => user.role === 'user').length
      }
    };
  }

  // Soft delete user
  async softDelete(id) {
    return this.updateById(id, { deletedAt: new Date() });
  }

  // Log user activity (mock implementation)
  async logActivity(userId, action, metadata = {}) {
    // Mock implementation - in real app, store in activity log table
    console.log(`User ${userId} performed action: ${action}`, metadata);
    return true;
  }

  // Get user activity (mock implementation)
  async getUserActivity(userId, options) {
    const { page = 1, limit = 10 } = options;
    
    // Mock activity logs
    const mockLogs = [
      {
        id: '1',
        action: 'login',
        timestamp: new Date(),
        metadata: { ip: '192.168.1.1' }
      },
      {
        id: '2',
        action: 'profile_update',
        timestamp: new Date(Date.now() - 86400000),
        metadata: { fields: ['name', 'phone'] }
      }
    ];

    return {
      logs: mockLogs,
      currentPage: page,
      totalPages: 1,
      totalLogs: mockLogs.length,
      hasNext: false,
      hasPrev: false
    };
  }
}

export default new UserService();