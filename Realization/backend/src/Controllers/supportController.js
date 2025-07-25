exports.sendSupportEmail = async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.length < 5) {
    return res.status(400).json({ error: 'Message is too short.' });
  }
  try {
    await sendMail({
      to: 'l_o_v_e.u@yahoo.com',
      subject: 'New Support Message from MindForge',
      text: message,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Support email error:', err);
    res.status(500).json({ error: 'Failed to send email.' });
  }
}; 