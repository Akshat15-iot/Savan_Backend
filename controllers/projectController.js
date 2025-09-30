const Project = require('../models/Project');

const allowedRoles = [
  'admin',
  'subadmin',
  'project_manager',
  'lead_manager',
  'account_manager',
  'sales_manager',
  'site_manager'
];

// Helper function to attach full image URLs
const formatProjectImages = (projects, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return projects.map(project => {
    const proj = project.toObject();
    proj.images = proj.images?.map(img => ({
      ...img,
      url: `${baseUrl}${img.url}`
    })) || [];
    return proj;
  });
};

// Get all projects with filters
const getProjects = async (req, res) => {
  try {
    const { city, category, minBudget, maxBudget, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (city) query.city = { $regex: city, $options: 'i' };
    if (category) query.category = category;
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = parseFloat(minBudget);
      if (maxBudget) query.budget.$lte = parseFloat(maxBudget);
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Project.countDocuments(query);
    const projectsWithImages = formatProjectImages(projects, req);

    res.json({
      totalProjects: total, // ✅ added total project count
      projects: projectsWithImages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single project
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, isActive: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [projectWithImage] = formatProjectImages([project], req);
    res.json(projectWithImage);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create projects' });
    }

    const { companyId } = req.params;
    const { projectName, budget, city, category, subType, startDate } = req.body;

    let images = [];

    if (req.file) {
      // For single file upload
      images.push({
        url: `/uploads/projects/${req.file.filename}`,
        caption: req.file.originalname
      });
    } else if (req.files && req.files.images) {
      // For multiple file upload
      images = req.files.images.map(file => ({
        url: `/uploads/projects/${file.filename}`,
        caption: file.originalname
      }));
    }

    const newProject = new Project({
      projectName,
      budget,
      city,
      category,
      subType,
      startDate,
      images,
      createdBy: req.user._id,
      companyId
    });
 
    await newProject.save();

    const [formattedProject] = formatProjectImages([newProject], req);
    console.log(req.files);
    res.status(201).json({ message: 'Project created successfully', project: formattedProject });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all projects for a company
const getProjectsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { companyId, isActive: true };

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Project.countDocuments(query);
    const projectsWithImages = formatProjectImages(projects, req);

    res.json({
      totalProjects: total, // ✅ added total project count
      projects: projectsWithImages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get projects by company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a project
const updateProject = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update projects' });
    }

    const { projectId } = req.params;
    const { projectName, budget, city, category, subType, startDate } = req.body;

    let updateData = { projectName, budget, city, category, subType, startDate };

    if (req.files && req.files.images && req.files.images.length > 0) {
      updateData.images = req.files.images.map(file => ({
        url: `/uploads/projects/${file.filename}`,
        caption: file.originalname
      }));
    }

    const project = await Project.findByIdAndUpdate(projectId, updateData, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [formattedProject] = formatProjectImages([project], req);
    console.log(req.files)
    res.json({ message: 'Project updated successfully', project: formattedProject });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  try {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to delete projects' });
    }

    const { projectId } = req.params;
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  getProjectsByCompany,
  updateProject,
  deleteProject
};
