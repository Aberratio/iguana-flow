export const testUsers = {
  validUser: {
    email: 'test@iguanaflow.com',
    password: 'TestPassword123!',
    username: 'testuser'
  },
  invalidUser: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  },
  newUser: {
    email: `newuser_${Date.now()}@test.com`,
    password: 'NewUser123!',
    username: `user_${Date.now()}`
  }
};

export const testChallenges = {
  free: {
    title: 'Wyzwanie 28 dni',
    duration: 28
  },
  premium: {
    title: 'Premium Challenge',
    isPremium: true
  }
};
