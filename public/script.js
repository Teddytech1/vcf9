document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
  
  const form = document.getElementById('uploadForm');
  const contactsList = document.getElementById('contactsList');
  const countSpan = document.getElementById('count');
  const phoneInput = document.getElementById('phone');

  // Load all contacts on page load
  loadContacts();
    // Theme switcher functionality
  const themeToggle = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check for saved theme preference or use system preference
  const currentTheme = localStorage.getItem('theme') || 
                      (prefersDarkScheme.matches ? 'dark' : 'light');
  document.body.setAttribute('data-theme', currentTheme);
  
  themeToggle.addEventListener('click', function() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const countryCode = document.getElementById('countryCode').value;
    const phone = phoneInput.value.trim();

    // Validate all fields
    if (!name || !countryCode || !phone) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    // Validate phone number format (exactly 9 digits)
    if (!/^\d{9}$/.test(phone)) {
      showAlert('Phone number must be exactly 9 digits (without country code)', 'error');
      phoneInput.focus();
      return;
    }

    try {
      // Check if contact exists first
      const checkResponse = await fetch('/check-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, country_code: countryCode })
      });
      
      const { exists } = await checkResponse.json();
      
      if (exists) {
        showAlert('This contact already exists in the system', 'error');
        return;
      }

      // If contact doesn't exist, proceed with upload
      const uploadResponse = await fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, country_code: countryCode })
      });
      
      const data = await uploadResponse.json();
      
      if (uploadResponse.ok) {
        showAlert('Contact added successfully!', 'success');
        form.reset();
        loadContacts();
      } else {
        throw new Error(data.error || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showAlert(error.message || 'Failed to add contact. Please try again.', 'error');
    }
  });

  // Load contacts function
  async function loadContacts() {
    try {
      const response = await fetch('/contacts');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const contacts = await response.json();
      
      // Update count
      countSpan.textContent = contacts.length;
      
      // Clear and rebuild table
      contactsList.innerHTML = '';
      
      if (contacts.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-row';
        emptyRow.innerHTML = `<td colspan="3">No contacts yet. Add your first contact!</td>`;
        contactsList.appendChild(emptyRow);
        return;
      }
      
      contacts.forEach((contact, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${contact.name}</td>
          <td>${contact.country_code}${contact.phone}</td>
        `;
        contactsList.appendChild(row);
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
      showAlert('Failed to load contacts. Please refresh the page.', 'error');
    }
  }

  // Show alert message
  function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
      existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <span>${message}</span>
      <button class="close-alert">&times;</button>
    `;
    
    document.body.appendChild(alert);
    
    // Add close functionality
    setTimeout(() => {
      alert.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => alert.remove(), 300);
    }, 5000);
    
    // Close button
    alert.querySelector('.close-alert').addEventListener('click', () => {
      alert.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => alert.remove(), 300);
    });
  }
  // Prevent non-numeric input in phone field
  phoneInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
});
