export const isUserAdmin = (user) => {
  return Boolean(user && user.role === 'admin');
};

export const formatUserDisplayName = (user) => {
  if (!user) return 'Guest';
  return user.fullName || user.username || user.email?.split('@')[0] || 'User';
};
