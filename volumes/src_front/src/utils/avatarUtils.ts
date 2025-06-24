import { showNotification } from './notifications';

export function handleAvatarUpload(onSuccess?: (avatarUrl: string) => void): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', async (e) => {
        const files = fileInput.files;
        if (!files || files.length === 0) {
            document.body.removeChild(fileInput);
            return;
        }

        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
                        
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                const avatarUrl = data.avatar_url;
                
                updateAvatarDisplay(avatarUrl);
                
                document.dispatchEvent(new CustomEvent('avatar-updated', { 
                    detail: { avatarUrl }
                }));
                
                showNotification('Avatar updated successfully!', 'success');
                
                if (onSuccess) {
                    onSuccess(avatarUrl);
                }
            } else {

                showNotification('Failed to upload avatar: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            
            showNotification('An error occurred while uploading the avatar.', 'error');
        }
        
        document.body.removeChild(fileInput);
    });

    fileInput.click();
}


export async function handleAvatarRemoval(onSuccess?: (defaultAvatarUrl: string) => void): Promise<void> {
    try {
        
        const response = await fetch('/api/avatar/remove', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (data.success) {
            const defaultAvatarUrl = '/uploads/default.png';
            
            updateAvatarDisplay(defaultAvatarUrl);
            
            document.dispatchEvent(new CustomEvent('avatar-updated', { 
                detail: { avatarUrl: defaultAvatarUrl }
            }));
            
            showNotification('Avatar has been removed.', 'success');
            
            if (onSuccess) {
                onSuccess(defaultAvatarUrl);
            }
        } else {
            
            throw new Error(data.error || 'Failed to remove avatar');
        }
    } catch (error) {
        
        showNotification('Failed to remove avatar. Please try again.', 'error');
    }
}


export function updateAvatarDisplay(avatarUrl: string): void {
    const avatarContainers = document.querySelectorAll('.avatar-container');
    if (avatarContainers.length === 0) return;
    
    avatarContainers.forEach(container => {
        const img = container.querySelector('img');
        if (img) {
            img.src = avatarUrl;
        } else {
            container.innerHTML = `
                <img src="${avatarUrl}" alt="User Avatar" class="w-full h-full object-cover rounded-lg" />
            `;
        }
    });
    
    const avatarImages = document.querySelectorAll('img[alt="User Avatar"], img[alt="Your Avatar"]');
    avatarImages.forEach(img => {
        if (img instanceof HTMLImageElement) {
            img.src = avatarUrl;
        }
    });
}
