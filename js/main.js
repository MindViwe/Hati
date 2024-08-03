document.addEventListener('DOMContentLoaded', () => {
    const addProjectBtn = document.getElementById('addProjectBtn');
    const modal = document.getElementById('addProjectModal');
    const closeBtn = document.querySelector('.modal .close');
    const form = document.getElementById('addProjectForm');

    addProjectBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const projectType = document.getElementById('projectType').value;
        // Handle the project type and add project logic here
        alert(`Project type ${projectType} added`);
        modal.style.display = 'none';
    });
});
