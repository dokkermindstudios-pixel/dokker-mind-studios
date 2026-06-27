// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Ember particle drift in hero (decorative, respects reduced motion)
  const field = document.querySelector('.ember-field');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(field && !reduce){
    const count = 22;
    for(let i=0;i<count;i++){
      const p = document.createElement('span');
      p.className = 'ember-particle';
      const size = 2 + Math.random()*3;
      p.style.width = size+'px';
      p.style.height = size+'px';
      p.style.left = Math.random()*100+'%';
      p.style.animationDuration = (6+Math.random()*8)+'s';
      p.style.animationDelay = (Math.random()*8)+'s';
      p.style.opacity = (0.3+Math.random()*0.5).toFixed(2);
      field.appendChild(p);
    }
  }

  // Simple contact/donation form feedback (no backend — static site)
const fields = document.querySelectorAll('.ember-field, .global-embers');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(fields.length && !reduce){
  fields.forEach(field => {
    const count = field.classList.contains('global-embers') ? 14 : 22;
    for(let i=0;i<count;i++){
      const p = document.createElement('span');
      p.className = 'ember-particle';
      const size = 2 + Math.random()*3;
      p.style.width = size+'px';
      p.style.height = size+'px';
      p.style.left = Math.random()*100+'%';
      p.style.animationDuration = (6+Math.random()*8)+'s';
      p.style.animationDelay = (Math.random()*8)+'s';
      p.style.opacity = (0.3+Math.random()*0.5).toFixed(2);
      field.appendChild(p);
    }
  });
}
