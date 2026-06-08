/* ============================================
   CONTACT.JS — EmailJS Form Handler
   Sekuwa By Kilo
   ============================================
   
   ⚠️ SETUP REQUIRED:
   Before the form works, you must:
   1. Create a free account at https://www.emailjs.com/
   2. Add your Gmail as an Email Service
   3. Create an Email Template
   4. Replace the 3 IDs below with your real values
   
   See EMAILJS_SETUP.md for step-by-step instructions.
   ============================================ */

// ──────────────────────────────────────────────
// 🔑 REPLACE THESE WITH YOUR EMAILJS CREDENTIALS
// ──────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // Dashboard → Account → Public Key
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // Dashboard → Email Services → Service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // Dashboard → Email Templates → Template ID
// ──────────────────────────────────────────────

// Rate limiting: prevent spam submissions
let lastSubmitTime = 0;
const RATE_LIMIT_MS = 30000; // 30 seconds between submissions

document.addEventListener('DOMContentLoaded', () => {

  // Initialize EmailJS
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  const form = document.getElementById('inquiryForm');
  const submitBtn = document.getElementById('submit-btn');

  // -------- FORM VALIDATION --------
  const validators = {
    name: (value) => {
      if (!value.trim()) return 'Please enter your name';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      return null;
    },
    email: (value) => {
      if (!value.trim()) return 'Please enter your email address';
      const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address';
      return null;
    },
    phone: (value) => {
      if (!value.trim()) return null; // phone is optional
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
      if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
      return null;
    },
    type: (value) => {
      if (!value) return 'Please select an inquiry type';
      return null;
    },
    message: (value) => {
      if (!value.trim()) return 'Please enter your message';
      if (value.trim().length < 10) return 'Message must be at least 10 characters';
      return null;
    }
  };

  const fieldMap = {
    name:    { input: 'input-name',  group: 'fg-name',    error: 'err-name' },
    email:   { input: 'input-email', group: 'fg-email',   error: 'err-email' },
    phone:   { input: 'input-phone', group: 'fg-phone',   error: 'err-phone' },
    type:    { input: 'input-type',  group: 'fg-type',    error: 'err-type' },
    message: { input: 'input-message', group: 'fg-message', error: 'err-message' }
  };

  const validateField = (fieldName) => {
    const field = fieldMap[fieldName];
    const input = document.getElementById(field.input);
    const group = document.getElementById(field.group);
    const errorEl = document.getElementById(field.error);
    const error = validators[fieldName](input.value);

    if (error) {
      group.classList.add('has-error');
      input.classList.add('error');
      errorEl.textContent = error;
      return false;
    } else {
      group.classList.remove('has-error');
      input.classList.remove('error');
      return true;
    }
  };

  const validateAll = () => {
    let isValid = true;
    Object.keys(validators).forEach(field => {
      if (!validateField(field)) isValid = false;
    });
    return isValid;
  };

  // Real-time validation on blur
  Object.keys(fieldMap).forEach(fieldName => {
    const input = document.getElementById(fieldMap[fieldName].input);
    input.addEventListener('blur', () => validateField(fieldName));
    input.addEventListener('input', () => {
      const group = document.getElementById(fieldMap[fieldName].group);
      if (group.classList.contains('has-error')) {
        validateField(fieldName);
      }
    });
  });

  // -------- TOAST NOTIFICATIONS --------
  const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const msg = toast.querySelector('.toast-message');

    icon.textContent = type === 'success' ? '✅' : '❌';
    msg.textContent = message;
    toast.className = `toast ${type}`;

    // Show
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
    }, 5000);
  };

  // -------- FORM SUBMISSION --------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check
    const honeypot = document.getElementById('hp-website');
    if (honeypot && honeypot.value) {
      // Bot detected — silently pretend success
      showToast('Thank you! Your inquiry has been sent.', 'success');
      form.reset();
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
      showToast(`Please wait ${waitSec} seconds before submitting again.`, 'error');
      return;
    }

    // Validate
    if (!validateAll()) {
      showToast('Please fill in all required fields correctly.', 'error');
      return;
    }

    // Set loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Collect form data
    const templateParams = {
      from_name:    document.getElementById('input-name').value.trim(),
      from_email:   document.getElementById('input-email').value.trim(),
      phone:        document.getElementById('input-phone').value.trim() || 'Not provided',
      inquiry_type: document.getElementById('input-type').value,
      message:      document.getElementById('input-message').value.trim(),
      to_email:     'nikeshshrestha135@gmail.com',
      restaurant:   'Sekuwa By Kilo — Jhamsikhel'
    };

    try {
      // Check if EmailJS is configured
      if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY' || 
          EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' || 
          EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID') {
        
        // Fallback: open mailto link if EmailJS not configured
        console.warn('EmailJS not configured. Using mailto fallback.');
        
        const subject = encodeURIComponent(`[${templateParams.inquiry_type}] Inquiry from ${templateParams.from_name}`);
        const body = encodeURIComponent(
          `Name: ${templateParams.from_name}\n` +
          `Email: ${templateParams.from_email}\n` +
          `Phone: ${templateParams.phone}\n` +
          `Inquiry Type: ${templateParams.inquiry_type}\n\n` +
          `Message:\n${templateParams.message}`
        );
        
        window.open(`mailto:nikeshshrestha135@gmail.com?subject=${subject}&body=${body}`, '_self');
        showToast('Opening your email client to send the inquiry...', 'success');
        form.reset();
        lastSubmitTime = now;
      } else {
        // Send via EmailJS
        const response = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams
        );

        if (response.status === 200) {
          showToast('Thank you! Your inquiry has been sent successfully. We\'ll get back to you soon!', 'success');
          form.reset();
          lastSubmitTime = now;
        } else {
          throw new Error('Email service returned an error');
        }
      }
    } catch (error) {
      console.error('Email send failed:', error);
      showToast('Something went wrong. Please try calling us at 980-1464630 or use WhatsApp.', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

});
