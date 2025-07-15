import { showNotification } from './notifications';

export function handleAvatarUpload(onSuccess?: (avatarUrl: string) => void): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/jpg';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', async (e) => {
        const files = fileInput.files;
        if (!files || files.length === 0) {
            document.body.removeChild(fileInput);
            return;
        }

        const file = files[0];
        
        // Validate file format
        const validFileTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validFileTypes.includes(file.type)) {
            showNotification("Invalid file format. Please upload a .png or .jpeg image.", 'error');
            document.body.removeChild(fileInput);
            return;
        }
        
        // Validate file size (1MB = 1048576 bytes)
        if (file.size > 1048576) {
            showNotification("Image size exceeds the 1MB limit. Please upload a smaller picture.", 'error');
            document.body.removeChild(fileInput);
            return;
        }
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            //console.log('Starting avatar upload...'); // Debug log
                        
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const data = await response.json();
            //console.log('Avatar upload response:', { success: data.success, status: response.status, data }); // Debug log
            
            if (data.success) {
                const avatarUrl = data.avatar_url;
                //console.log('Avatar upload successful, new URL:', avatarUrl); // Debug log
                
                if ((window as any).user) {
                    (window as any).user.avatar_url = avatarUrl;
                }
                
                updateAvatarDisplay(avatarUrl);
                
                document.dispatchEvent(new CustomEvent('avatar-updated', { 
                    detail: { avatarUrl }
                }));
                
                showNotification('Avatar updated successfully!', 'success');
                
                if (onSuccess) {
                    onSuccess(avatarUrl);
                }
            } else {
                //console.error('Avatar upload failed:', data.error || 'Unknown error'); // Debug log
                showNotification('Failed to upload avatar: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            //console.error('Avatar upload error:', error); // Debug log
            showNotification('An error occurred while uploading the avatar.', 'error');
        }
        
        document.body.removeChild(fileInput);
    });

    fileInput.click();
}


export async function handleAvatarRemoval(onSuccess?: (defaultAvatarUrl: string) => void): Promise<void> {
    try {
        //console.log('Starting avatar removal...'); // Debug log
        
        const response = await fetch('/api/avatar/remove', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        console.log('Avatar removal response:', { success: data.success, status: response.status, data }); // Debug log
        
        if (data.success) {
            //console.log('Avatar removal successful'); // Debug log
            const defaultAvatarUrl = '/uploads/default.png';
            
            // Update global user object
            if ((window as any).user) {
                (window as any).user.avatar_url = 'default.png';
            }
            
            updateAvatarDisplay(defaultAvatarUrl);
            
            document.dispatchEvent(new CustomEvent('avatar-updated', { 
                detail: { avatarUrl: defaultAvatarUrl }
            }));
            
            showNotification('Avatar has been removed.', 'success');
            
            if (onSuccess) {
                onSuccess(defaultAvatarUrl);
            }
        } else {
            console.error('Avatar removal failed:', data.error || 'Unknown error'); // Debug log
            throw new Error(data.error || 'Failed to remove avatar');
        }
    } catch (error) {
        //console.error('Avatar removal error:', error); // Debug log
        showNotification('Failed to remove avatar. Please try again.', 'error');
    }
}


export function updateAvatarDisplay(avatarUrl: string): void {
    const avatarContainers = document.querySelectorAll('.avatar-container');
    if (avatarContainers.length === 0) return;
    
    // Add cache busting parameter to prevent browser caching
    const cacheBustedUrl = avatarUrl + '?t=' + Date.now();
    
    avatarContainers.forEach(container => {
        const img = container.querySelector('img');
        if (img) {
            img.src = cacheBustedUrl;
        } else {
            container.innerHTML = `
                <img src="${cacheBustedUrl}" alt="User Avatar" class="w-full h-full object-cover rounded-lg" />
            `;
        }
    });
    
    const avatarImages = document.querySelectorAll('img[alt="User Avatar"], img[alt="Your Avatar"]');
    avatarImages.forEach(img => {
        if (img instanceof HTMLImageElement) {
            img.src = cacheBustedUrl;
        }
    });
}
