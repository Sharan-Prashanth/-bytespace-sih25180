# 🔐 NaCCER Portal Test Credentials

## Quick Login Credentials

### 👑 Super Admin (Full system access, user management, proposal oversight)
- **Email:** bytespacesih@gmail.com  
- **Password:** adminpass
- **Name:** Admin User
- **Organization:** NaCCER Administration
- **Designation:** System Administrator

### 👤 Regular User (Can create and edit their own proposals)
- **Email:** user-bs@gmail.com  
- **Password:** userpass
- **Name:** Regular User
- **Organization:** Indian Institute of Technology
- **Designation:** Research Scholar

### 🏢 CMPDI Member (Initial technical review and expert assignment)
- **Email:** cmpdi-bs@gmail.com  
- **Password:** cmpdipass
- **Name:** CMPDI Member
- **Organization:** Central Mine Planning & Design Institute
- **Designation:** Senior Technical Officer

### 🎓 Expert Reviewer (Domain expert evaluation)
- **Email:** expert-bs@gmail.com  
- **Password:** expertpass
- **Name:** Expert Reviewer
- **Organization:** Indian School of Mines
- **Designation:** Professor & Domain Expert

### 📋 TSSRC Member (Technical Sub-Committee review)
- **Email:** tssrc-bs@gmail.com  
- **Password:** tssrcpass
- **Name:** TSSRC Member
- **Organization:** Ministry of Coal
- **Designation:** Technical Sub-Committee Chairperson

### ✅ SSRC Member (Final approval committee)
- **Email:** ssrc-bs@gmail.com  
- **Password:** ssrcpass
- **Name:** SSRC Member
- **Organization:** Coal India Limited
- **Designation:** Standing Scientific Research Committee Member

## 🎯 Testing Workflow

### 1. **As Regular User (user-bs@gmail.com):**
   - Login and create a new research proposal
   - Edit proposal forms and upload documents
   - Track proposal status through the workflow
   - Respond to clarification requests
   - View final approval/rejection

### 2. **As CMPDI Member (cmpdi-bs@gmail.com):**
   - Review submitted proposals
   - Assign expert reviewers
   - Evaluate expert reviews
   - Approve, reject, or request clarifications
   - Forward approved proposals to TSSRC

### 3. **As Expert Reviewer (expert-bs@gmail.com):**
   - View assigned proposals
   - Conduct detailed technical evaluation
   - Submit expert review reports
   - Provide ratings and recommendations

### 4. **As TSSRC Member (tssrc-bs@gmail.com):**
   - Review CMPDI-approved proposals
   - Evaluate technical feasibility
   - Request clarifications if needed
   - Approve or reject proposals
   - Forward approved proposals to SSRC

### 5. **As SSRC Member (ssrc-bs@gmail.com):**
   - Final review of TSSRC-approved proposals
   - Make final approval decisions
   - Mark projects as ongoing after approval
   - Monitor project progress

### 6. **As Super Admin (bytespacesih@gmail.com):**
   - Manage all user accounts
   - View all proposals across the system
   - Override proposal statuses if needed
   - Generate system statistics
   - Create users with specific roles

## 🔄 Complete Workflow Test
1. Create proposal with `user-bs@gmail.com` → Status: Draft → Submitted
2. CMPDI reviews with `cmpdi-bs@gmail.com` → Assigns expert
3. Expert evaluates with `expert-bs@gmail.com` → Submits review
4. CMPDI approves with `cmpdi-bs@gmail.com` → Forwards to TSSRC
5. TSSRC reviews with `tssrc-bs@gmail.com` → Approves → Forwards to SSRC
6. SSRC final approval with `ssrc-bs@gmail.com` → Project Ongoing
7. User tracks progress with `user-bs@gmail.com`

## 🚀 URLs
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:5000
- **Database:** MongoDB (check .env for MONGODB_URI)

## 🔧 Seed Database Users
To populate the database with test users:
```bash
cd server
node scripts/seedUsers.js
```

Or add this to package.json scripts and run `npm run seed`:
```json
"scripts": {
  "seed": "node scripts/seedUsers.js"
}
```

## 📝 Notes
- All accounts are active by default
- Passwords are hashed using bcrypt (salt rounds: 12)
- Each role has specific permissions and dashboard views
- Super Admin can manage all users and override proposal statuses
- Email verification is currently set to true by default