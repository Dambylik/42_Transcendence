function toggleButton(btn: HTMLElement, enabled: boolean) {
    if (enabled) {
        btn.removeAttribute('disabled');
        btn.classList.remove('opacity-50');
    } else {
        btn.setAttribute('disabled', 'true');
        btn.classList.add('opacity-50');
    }
}

export default toggleButton;
