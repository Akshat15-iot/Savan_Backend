// Permission-based middleware for fine-grained access control

// Check if user has permission to view a resource
const canView = (resource) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      // Admin has access to everything
      if (user.role === 'admin ') {
        return next();
      }

      // Check if user has view permission for the resource
      if (user.permissions && user.permissions[resource] && user.permissions[resource].view) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission to view ${resource}.`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

// Check if user has permission to manage (create, update, delete) a resource
const canManage = (resource) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      // Admin has access to everything
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has manage permission for the resource
      if (user.permissions && user.permissions[resource] && user.permissions[resource].manage) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied. You don't have permission to manage ${resource}.`
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

// Check if user has any of the specified permissions
const hasAnyPermission = (permissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      // Admin has access to everything
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has any of the specified permissions
      for (const permission of permissions) {
        const [resource, action] = permission.split('.');
        if (user.permissions && 
            user.permissions[resource] && 
            user.permissions[resource][action]) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

// Check if user has all of the specified permissions
const hasAllPermissions = (permissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      // Admin has access to everything
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has all of the specified permissions
      for (const permission of permissions) {
        const [resource, action] = permission.split('.');
        if (!user.permissions || 
            !user.permissions[resource] || 
            !user.permissions[resource][action]) {
          return res.status(403).json({
            success: false,
            message: `Access denied. Missing permission: ${permission}`
          });
        }
      }

      return next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

// Middleware to check if user is admin or has specific role
const isAdminOrRole = (roles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      // Admin always has access
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has one of the specified roles
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (allowedRoles.includes(user.role)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient role permissions.'
      });
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during role check'
      });
    }
  };
};

// Helper function to get user permissions for frontend
const getUserPermissions = (req, res) => {
  try {
    const user = req.user;
    
    if (user.role === 'admin') {
      // Admin has all permissions
      return res.json({
        success: true,
        permissions: {
          leads: { view: true, manage: true },
          projects: { view: true, manage: true },
          payments: { view: true, manage: true },
          reports: { view: true, manage: true },
          users: { view: true, manage: true },
          companies: { view: true, manage: true },
          properties: { view: true, manage: true },
          sites: { view: true, manage: true },
          inventory: { view: true, manage: true },
          dashboard: { view: true }
        },
        role: user.role
      });
    }

    return res.json({
      success: true,
      permissions: user.permissions || {},
      role: user.role
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error getting permissions'
    });
  }
};

module.exports = {
  canView,
  canManage,
  hasAnyPermission,
  hasAllPermissions,
  isAdminOrRole,
  getUserPermissions
};
