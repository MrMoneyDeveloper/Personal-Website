document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
  }

  if (window.VANTA && window.VANTA.NET && window.innerWidth > 768) {
    window.VANTA.NET({
      el: '#vanta-bg',
      color: 0x6cbfff,
      backgroundColor: 0x06080f,
      points: 11.0,
      maxDistance: 19.0,
      spacing: 15.0,
      showDots: false,
      mouseControls: true,
      touchControls: true,
      gyroControls: false
    });
  }

  if (window.gsap) {
    gsap.registerPlugin(window.ScrollTrigger);
    gsap.to('.hero .display', {
      y: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.utils.toArray('.reveal').forEach((item, index) => {
      gsap.to(item, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay: index % 3 * 0.05,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 84%',
          once: true
        }
      });
    });

    gsap.utils.toArray('.card, .project-card, .news-item').forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        gsap.to(card, {
          rotateY: x * 6,
          rotateX: -y * 5,
          transformPerspective: 900,
          transformOrigin: 'center',
          duration: 0.25,
          ease: 'power1.out'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.45, ease: 'power3.out' });
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
});
