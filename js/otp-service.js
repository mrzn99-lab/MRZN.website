// ============ OTP SERVICE ============

class OTPService {
  constructor() {
    this.supabase = window.supabaseClient;
  }

  // Generate 8-digit code
  generateCode() {
    return Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0');
  }

  // Send OTP
  async sendOTP(email) {
    try {
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in database
      const { error: insertError } = await this.supabase
        .from('otp_codes')
        .insert({
          email: email,
          code: code,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) throw insertError;

      // Send email
      const response = await fetch('js/send-otp-email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          code: code
        })
      });

      if (!response.ok) throw new Error('Failed to send email');

      return { success: true, error: null };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verify OTP
  async verifyOTP(email, code) {
    try {
      const { data, error } = await this.supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('used', false)
        .single();

      if (error) throw new Error('Invalid OTP');

      // Check expiry
      if (new Date(data.expires_at) < new Date()) {
        throw new Error('OTP expired');
      }

      // Mark as used
      await this.supabase
        .from('otp_codes')
        .update({ used: true })
        .eq('id', data.id);

      return { success: true, error: null };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Clean expired OTPs
  async cleanExpiredOTPs() {
    await this.supabase
      .from('otp_codes')
      .delete()
      .lt('expires_at', new Date().toISOString());
  }
}

window.otpService = new OTPService();
