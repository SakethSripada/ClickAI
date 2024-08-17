window.addEventListener('message', (event) => {
    const { type, content } = event.data;
    if (type === 'render-math') {
        const mathContent = document.getElementById('math-content');
        mathContent.innerHTML = content;
        MathJax.typesetPromise([mathContent]);
    }
});
