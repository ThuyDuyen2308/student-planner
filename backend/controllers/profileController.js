const { query } = require('../config/db');

async function updateProfile(req, res) {
  try {
    const { fullname, avatar_url } = req.body;
    let updateQuery = 'UPDATE users SET ';
    const params = [];
    
    if (fullname !== undefined) {
      updateQuery += 'fullname = ? ';
      params.push(fullname);
    }
    
    if (avatar_url !== undefined) {
      if (params.length > 0) updateQuery += ', ';
      updateQuery += 'avatar_url = ? ';
      params.push(avatar_url);
    }
    
    if (params.length === 0) return res.json({ message: 'No changes made' });
    
    updateQuery += 'WHERE id = ?';
    params.push(req.user.id);
    
    await query(updateQuery, params);
    
    const [user] = await query('SELECT id, username, email, fullname, avatar_url, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating profile' });
  }
}

async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const avatarUrl = '/uploads/' + req.file.filename;
    await query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
    
    const [user] = await query('SELECT id, username, email, fullname, avatar_url, role FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Avatar updated', user, avatarUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
}

module.exports = {
  updateProfile,
  uploadAvatar
};
