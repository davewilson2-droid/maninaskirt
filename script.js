const contactForm = document.querySelector("#contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const name = data.get("name").toString().trim();
    const email = data.get("email").toString().trim();
    const subject = data.get("subject").toString().trim();
    const message = data.get("message").toString().trim();
    const body = `${message}\n\nFrom: ${name}\nEmail: ${email}`;
    const mailto = `mailto:hello@maninaskirt.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  });
}
