import mongoose from 'mongoose';
import User from './models/User';
import Team from './models/Team';
import Project from './models/Project';
import Task from './models/Task';

export const seedDB = async () => {
  try {
    const userCount = await User.countDocuments();
    const teamCount = await Team.countDocuments();
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();

    if (userCount >= 20 && projectCount >= 5 && taskCount >= 10) {
      console.log('✅ Database already contains sufficient data. Skipping seeding.');
      return;
    }

    console.log('🌱 Clearing old data and seeding expanded database...');
    await User.deleteMany({});
    await Team.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    console.log('🌱 Seeding 20 Users...');
    const rawUsers = [
      { name: 'Admin Boss', email: 'admin@example.com', role: 'admin', dpt: 'Executive', exp: 10, perf: 95, tc: 50 },
      { name: 'Sarah Manager', email: 'sarah@example.com', role: 'manager', dpt: 'Engineering', exp: 8, perf: 92, tc: 40 },
      { name: 'Mike Leader', email: 'mike@example.com', role: 'manager', dpt: 'Design', exp: 7, perf: 88, tc: 35 },
      { name: 'Mustakim Shaikh', email: 'mustakim.shaikh.prof@gmail.com', role: 'employee', dpt: 'Engineering', exp: 5, perf: 98, tc: 25 },
      ...Array.from({ length: 16 }).map((_, i) => ({
        name: `Employee ${i + 1}`,
        email: `emp${i + 1}@example.com`,
        role: 'employee',
        dpt: i % 2 === 0 ? 'Engineering' : 'Design',
        exp: Math.floor(Math.random() * 8) + 1,
        perf: Math.floor(Math.random() * 30) + 70, // 70 to 100
        tc: Math.floor(Math.random() * 20) + 5
      }))
    ];

    const usersData = rawUsers.map(u => ({
      name: u.name, email: u.email, password: 'password123', role: u.role,
      department: u.dpt, experience: u.exp, performanceScore: u.perf, tasksCompleted: u.tc
    }));
    
    const users = await User.insertMany(usersData);
    const admin = users.find(u => u.role === 'admin')!;
    const managerEng = users.find(u => u.email === 'sarah@example.com')!;
    const managerDes = users.find(u => u.email === 'mike@example.com')!;
    const engEmployees = users.filter(u => u.role === 'employee' && u.department === 'Engineering');
    const desEmployees = users.filter(u => u.role === 'employee' && u.department === 'Design');

    console.log('🌱 Seeding 3 Teams...');
    const teams = await Team.insertMany([
      { name: 'Alpha Engineering', description: 'Core product engineering team', managerId: managerEng._id, members: engEmployees.slice(0, 5).map(u => u._id), department: 'Engineering' },
      { name: 'Beta Engineering', description: 'Backend and Infrastructure', managerId: managerEng._id, members: engEmployees.slice(5).map(u => u._id), department: 'Engineering' },
      { name: 'Creative Mavericks', description: 'Product design and UX/UI', managerId: managerDes._id, members: desEmployees.map(u => u._id), department: 'Design' }
    ]);

    for (const team of teams) {
      await User.updateMany({ _id: { $in: team.members } }, { teamId: team._id });
    }

    console.log('🌱 Seeding 6 Projects...');
    const projects = await Project.insertMany([
      { title: 'V2 Platform Launch', description: 'Rebuilding the core platform', deadline: new Date(Date.now() + 30*86400000), status: 'active', priority: 'critical', teamId: teams[0]._id, managerId: managerEng._id, progress: 35, estimatedHours: 400, actualHours: 150 },
      { title: 'Cloud Migration', description: 'Migrate to AWS', deadline: new Date(Date.now() + 45*86400000), status: 'planning', priority: 'high', teamId: teams[1]._id, managerId: managerEng._id, progress: 10, estimatedHours: 300, actualHours: 30 },
      { title: 'Design System Update', description: 'New color tokens', deadline: new Date(Date.now() + 15*86400000), status: 'review', priority: 'medium', teamId: teams[2]._id, managerId: managerDes._id, progress: 90, estimatedHours: 80, actualHours: 85 },
      { title: 'Mobile App MVP', description: 'React Native app', deadline: new Date(Date.now() + 60*86400000), status: 'planning', priority: 'high', teamId: teams[0]._id, managerId: managerEng._id, progress: 0, estimatedHours: 600, actualHours: 0 },
      { title: 'Marketing Site Redesign', description: 'Next.js marketing site', deadline: new Date(Date.now() + 20*86400000), status: 'active', priority: 'medium', teamId: teams[2]._id, managerId: managerDes._id, progress: 50, estimatedHours: 120, actualHours: 60 },
      { title: 'API Performance Tuning', description: 'Optimize slow queries', deadline: new Date(Date.now() + 10*86400000), status: 'active', priority: 'high', teamId: teams[1]._id, managerId: managerEng._id, progress: 75, estimatedHours: 100, actualHours: 80 }
    ]);

    console.log('🌱 Seeding Tasks...');
    const tasksData = [];
    const statuses = ['todo', 'in-progress', 'review', 'completed'];
    const priorities = ['low', 'medium', 'high', 'critical'];

    // Ensure Mustakim gets at least 5 tasks across different statuses
    const mustakim = users.find(u => u.email === 'mustakim.shaikh.prof@gmail.com')!;
    for (let i = 0; i < 5; i++) {
      tasksData.push({
        title: `Mustakim's Task ${i + 1}`, description: 'Important assigned work', projectId: projects[0]._id,
        assignedTo: mustakim._id, createdBy: managerEng._id, status: statuses[i % 4], priority: priorities[i % 4],
        estimatedHours: 10 + i * 2, actualHours: i === 3 ? 15 : i * 2, deadline: new Date(Date.now() + (i * 2 - 2) * 86400000)
      });
    }

    // Random tasks for others
    for (let i = 0; i < 25; i++) {
      const proj = projects[i % 6];
      const assignee = users[Math.floor(Math.random() * 16) + 3]; // Pick a random employee
      const status = statuses[Math.floor(Math.random() * 4)];
      tasksData.push({
        title: `Task ${i + 1} for ${proj.title}`, description: 'Standard workflow task', projectId: proj._id,
        assignedTo: assignee._id, createdBy: proj.managerId, status, priority: priorities[Math.floor(Math.random() * 4)],
        estimatedHours: Math.floor(Math.random() * 20) + 4, actualHours: status === 'completed' ? 20 : Math.floor(Math.random() * 10),
        deadline: new Date(Date.now() + (Math.floor(Math.random() * 20) - 5) * 86400000)
      });
    }

    await Task.insertMany(tasksData);
    console.log('✅ Database expanded & seeded successfully with 20 users, 3 teams, 6 projects, and 30 tasks!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
};
