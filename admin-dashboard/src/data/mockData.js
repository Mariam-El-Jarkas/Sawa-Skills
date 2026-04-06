// Mock data for all admin dashboard sections

export const mockStats = {
  totalUsers: 2847,
  activeToday: 312,
  totalExchanges: 1563,
  pendingVerifications: 28,
  pendingReports: 14,
  volunteerSessions: 87,
  totalPosts: 4219,
  messagesSent: 18402,
}

export const mockUsers = [
  { id: 'U001', name: 'Sarah Mitchell', email: 'sarah.m@example.com', role: 'user', verified: 'adult', location: 'Beirut', joinDate: '2025-11-12', status: 'active', reports: 0 },
  { id: 'U002', name: 'John Daher', email: 'john.d@example.com', role: 'user', verified: 'none', location: 'Tripoli', joinDate: '2025-12-01', status: 'active', reports: 1 },
  { id: 'U003', name: 'Maya Khalil', email: 'maya.k@example.com', role: 'volunteer', verified: 'adult', location: 'Sidon', joinDate: '2025-10-22', status: 'active', reports: 0 },
  { id: 'U004', name: 'Omar Tabbara', email: 'omar.t@example.com', role: 'user', verified: 'minor', location: 'Beirut', joinDate: '2026-01-05', status: 'suspended', reports: 3 },
  { id: 'U005', name: 'Lena Haddad', email: 'lena.h@example.com', role: 'user', verified: 'none', location: 'Jounieh', joinDate: '2026-01-18', status: 'active', reports: 0 },
  { id: 'U006', name: 'Karim Nassar', email: 'karim.n@example.com', role: 'user', verified: 'adult', location: 'Batroun', joinDate: '2025-09-30', status: 'active', reports: 0 },
  { id: 'U007', name: 'Rania Saad', email: 'rania.s@example.com', role: 'volunteer', verified: 'adult', location: 'Tyre', joinDate: '2025-08-14', status: 'active', reports: 0 },
  { id: 'U008', name: 'Ali Khoury', email: 'ali.k@example.com', role: 'user', verified: 'none', location: 'Zahle', joinDate: '2026-02-01', status: 'banned', reports: 7 },
]

export const mockVerifications = [
  { id: 'V001', userId: 'U009', name: 'Nour Farhat', email: 'nour.f@example.com', type: 'adult', submittedAt: '2026-03-20 14:32', status: 'pending', documents: ['id_front.jpg', 'id_back.jpg', 'selfie.jpg'] },
  { id: 'V002', userId: 'U010', name: 'Jad Mansour', email: 'jad.m@example.com', type: 'minor', submittedAt: '2026-03-21 09:10', status: 'pending', parentEmail: 'parent.mansour@example.com', requestedAt: '2026-03-21 09:10' },
  { id: 'V003', userId: 'U011', name: 'Dina Rizk', email: 'dina.r@example.com', type: 'adult', submittedAt: '2026-03-19 18:45', status: 'approved', documents: ['passport.jpg', 'selfie.jpg'] },
  { id: 'V004', userId: 'U012', name: 'Fadi Abi Nader', email: 'fadi.a@example.com', type: 'adult', submittedAt: '2026-03-18 11:20', status: 'rejected', documents: ['id_front.jpg'] },
  { id: 'V005', userId: 'U013', name: 'Tala Hamdan', email: 'tala.h@example.com', type: 'minor', submittedAt: '2026-03-22 08:00', status: 'pending', parentEmail: 'hamdan.parent@example.com', requestedAt: '2026-03-22 08:00' },
]

export const mockReports = [
  { id: 'R001', type: 'user', reportedName: 'Ali Khoury', reportedId: 'U008', reason: 'Harassment', reportedBy: 'Sarah Mitchell', status: 'pending', date: '2026-03-21', description: 'User sent threatening messages during skill swap.' },
  { id: 'R002', type: 'post', reportedName: 'Post #4102', reportedId: 'P4102', reason: 'Spam', reportedBy: 'John Daher', status: 'pending', date: '2026-03-22', description: 'Post contains repeated promotional content.' },
  { id: 'R003', type: 'user', reportedName: 'Omar Tabbara', reportedId: 'U004', reason: 'Fake Profile', reportedBy: 'Maya Khalil', status: 'resolved', date: '2026-03-18', description: 'Profile photo appears to be stolen from another account.' },
  { id: 'R004', type: 'post', reportedName: 'Post #3987', reportedId: 'P3987', reason: 'Inappropriate Content', reportedBy: 'Lena Haddad', status: 'pending', date: '2026-03-23', description: 'Post contains offensive language.' },
  { id: 'R005', type: 'user', reportedName: 'Unknown User', reportedId: 'U015', reason: 'Scam', reportedBy: 'Karim Nassar', status: 'dismissed', date: '2026-03-17', description: 'User asked for money outside the platform.' },
]

export const mockPosts = [
  { id: 'P001', author: 'Sarah Mitchell', content: 'Just completed an amazing cooking swap! Highly recommend skill swapping.', likes: 24, comments: 8, reports: 0, createdAt: '2026-03-21', status: 'visible' },
  { id: 'P002', author: 'Sawa AI', content: 'New skill exchange opportunities detected in your area!', likes: 45, comments: 15, reports: 0, createdAt: '2026-03-21', status: 'visible' },
  { id: 'P003', author: 'John Daher', content: 'Looking for photography lessons. Offering web dev in return!', likes: 12, comments: 4, reports: 1, createdAt: '2026-03-20', status: 'visible' },
  { id: 'P004', author: 'Ali Khoury', content: 'BUY FOLLOWERS NOW! CHEAP PRICES! CLICK HERE!!!', likes: 0, comments: 2, reports: 5, createdAt: '2026-03-19', status: 'hidden' },
  { id: 'P005', author: 'Maya Khalil', content: 'Offering free Arabic tutoring sessions this weekend in Sidon.', likes: 67, comments: 23, reports: 0, createdAt: '2026-03-18', status: 'visible' },
]

export const mockSwaps = [
  { id: 'SW001', user1: 'Sarah Mitchell', user2: 'John Daher', skill1: 'Cooking', skill2: 'Guitar Lessons', status: 'active', progress: 60, rating1: null, rating2: null, reports: 0, startDate: '2026-03-10' },
  { id: 'SW002', user1: 'Maya Khalil', user2: 'Omar Tabbara', skill1: 'Arabic Tutoring', skill2: 'Photography', status: 'completed', progress: 100, rating1: 4.8, rating2: 4.5, reports: 0, startDate: '2026-02-20' },
  { id: 'SW003', user1: 'Lena Haddad', user2: 'Karim Nassar', skill1: 'Painting', skill2: 'Music', status: 'pending', progress: 0, rating1: null, rating2: null, reports: 0, startDate: '2026-03-22' },
  { id: 'SW004', user1: 'Rania Saad', user2: 'Ali Khoury', skill1: 'English Tutoring', skill2: 'Web Development', status: 'disputed', progress: 30, rating1: null, rating2: null, reports: 2, startDate: '2026-03-05' },
]

export const mockVolunteer = [
  { id: 'VOL001', title: 'Free Cooking Classes for Children', organizer: 'Sarah Mitchell', location: 'Beirut', date: '2026-03-28', participants: 8, maxParticipants: 12, status: 'approved' },
  { id: 'VOL002', title: 'Community Guitar Lessons', organizer: 'John Daher', location: 'Tripoli', date: '2026-04-02', participants: 5, maxParticipants: 10, status: 'pending' },
  { id: 'VOL003', title: 'Web Development Basics', organizer: 'Maya Khalil', location: 'Sidon', date: '2026-04-10', participants: 15, maxParticipants: 20, status: 'approved' },
  { id: 'VOL004', title: 'Arabic Calligraphy Workshop', organizer: 'Rania Saad', location: 'Tyre', date: '2026-04-05', participants: 3, maxParticipants: 15, status: 'pending' },
]

export const mockSkillCategories = [
  { id: 'SC001', name: 'Technology', skills: ['Web Development', 'Mobile Dev', 'AI & ML', 'Cybersecurity', 'Data Science'], count: 342, trending: true },
  { id: 'SC002', name: 'Creative Arts', skills: ['Painting', 'Photography', 'Graphic Design', 'Illustration'], count: 218, trending: false },
  { id: 'SC003', name: 'Music', skills: ['Guitar', 'Piano', 'Vocals', 'Music Production', 'Oud'], count: 189, trending: true },
  { id: 'SC004', name: 'Languages', skills: ['Arabic', 'English', 'French', 'Spanish', 'German'], count: 456, trending: true },
  { id: 'SC005', name: 'Cooking', skills: ['Lebanese Cuisine', 'Pastry', 'Vegan Cooking', 'BBQ'], count: 167, trending: false },
  { id: 'SC006', name: 'Business', skills: ['Marketing', 'Finance', 'Entrepreneurship', 'Sales'], count: 134, trending: false },
]

export const mockNotifications = [
  { id: 'N001', title: 'Platform Maintenance', message: 'Scheduled maintenance on April 5th from 2-4 AM.', target: 'all', sentAt: '2026-03-20', status: 'sent', reach: 2847 },
  { id: 'N002', title: 'New Skill Categories Added', message: 'We have added Photography and Videography to skill categories!', target: 'all', sentAt: '2026-03-15', status: 'sent', reach: 2847 },
  { id: 'N003', title: 'Volunteer Program Launch', message: 'Apply now to become a volunteer mentor on Sawa Skills.', target: 'verified', sentAt: '2026-03-10', status: 'sent', reach: 1203 },
]

export const mockLogs = [
  { id: 'L001', type: 'admin_action', action: 'Banned user U008', admin: 'admin@sawa.com', ip: '192.168.1.1', timestamp: '2026-03-22 14:23:01', severity: 'warning' },
  { id: 'L002', type: 'login', action: 'Admin login successful', admin: 'admin@sawa.com', ip: '192.168.1.1', timestamp: '2026-03-22 14:20:00', severity: 'info' },
  { id: 'L003', type: 'error', action: 'Backend API timeout on /api/swaps', admin: 'system', ip: 'internal', timestamp: '2026-03-22 13:45:12', severity: 'error' },
  { id: 'L004', type: 'admin_action', action: 'Approved verification V003', admin: 'admin@sawa.com', ip: '192.168.1.1', timestamp: '2026-03-22 11:10:44', severity: 'info' },
  { id: 'L005', type: 'suspicious', action: 'Multiple failed login attempts from IP 45.33.32.156', admin: 'system', ip: '45.33.32.156', timestamp: '2026-03-22 10:02:33', severity: 'error' },
  { id: 'L006', type: 'admin_action', action: 'Deleted post P4102 (spam)', admin: 'admin@sawa.com', ip: '192.168.1.1', timestamp: '2026-03-21 18:30:00', severity: 'warning' },
  { id: 'L007', type: 'login', action: 'Admin login successful', admin: 'moderator@sawa.com', ip: '10.0.0.4', timestamp: '2026-03-21 09:00:00', severity: 'info' },
]

export const mockAdmins = [
  { id: 'A001', name: 'Platform Admin', email: 'admin@sawa.com', role: 'super_admin', lastLogin: '2026-03-22 14:20', status: 'active', createdAt: '2025-08-01' },
  { id: 'A002', name: 'Content Moderator', email: 'moderator@sawa.com', role: 'moderator', lastLogin: '2026-03-21 09:00', status: 'active', createdAt: '2025-09-15' },
  { id: 'A003', name: 'Support Agent', email: 'support@sawa.com', role: 'support', lastLogin: '2026-03-20 15:45', status: 'active', createdAt: '2025-11-01' },
]

export const mockUserGrowth = [
  { month: 'Sep', users: 120 }, { month: 'Oct', users: 340 }, { month: 'Nov', users: 680 },
  { month: 'Dec', users: 1100 }, { month: 'Jan', users: 1580 }, { month: 'Feb', users: 2100 },
  { month: 'Mar', users: 2847 },
]

export const mockDailyActive = [
  { day: 'Mon', users: 245 }, { day: 'Tue', users: 312 }, { day: 'Wed', users: 289 },
  { day: 'Thu', users: 356 }, { day: 'Fri', users: 401 }, { day: 'Sat', users: 378 },
  { day: 'Sun', users: 298 },
]

export const mockSkillDemand = [
  { name: 'Languages', value: 456 }, { name: 'Technology', value: 342 },
  { name: 'Creative Arts', value: 218 }, { name: 'Music', value: 189 },
  { name: 'Cooking', value: 167 }, { name: 'Business', value: 134 },
]

export const mockExchangeStats = [
  { month: 'Sep', completed: 45, pending: 12 }, { month: 'Oct', completed: 98, pending: 23 },
  { month: 'Nov', completed: 167, pending: 34 }, { month: 'Dec', completed: 234, pending: 41 },
  { month: 'Jan', completed: 312, pending: 55 }, { month: 'Feb', completed: 398, pending: 62 },
  { month: 'Mar', completed: 309, pending: 48 },
]
