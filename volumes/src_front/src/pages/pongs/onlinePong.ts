import BasePongPage from '../../core/templates/basePongPage';
import { Router } from '../../../router/Router.ts';
import onlineGame from '../../assets/online_game.png';
import { showNotification } from '../../utils/notifications';
import { createFormContainer } from '../../core/components/pong/pongFormUtils.ts';
import { createCyberButton, createPageHeader, createBackgroundLayers, createInputField} from '../../core/components/pong/pongUtils.ts';

class OnlinePongPage extends BasePongPage {
    static TextObject = {
        MainTitle: 'ONLINE PONG',
        Subtitle: 'ENTER THE NETWORK',
        CreateRoomButton: 'CREATE ROOM',
        JoinRoomButton: 'JOIN ROOM',
        ReturnHome: 'RETURN HOME',
        ChooseBattlefield: 'CHOOSE YOUR BATTLEFIELD',
        CreateNewRoom: 'CREATE NEW ROOM',
        AvailableRooms: 'AVAILABLE ROOMS',
        NoRooms: 'NO ROOMS AVAILABLE'
    };

    constructor(id: string = 'online-pong', router?: Router) {
        super(id, router);
    }

    async fetchRooms() {
        try {
        const response = await fetch('/api/rooms', {
            credentials: 'include',
            headers: {
            'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            return data.rooms;
        } else {
            console.error('Failed to fetch rooms:', data.error);
            return [];
        }
        } catch (err) {
        console.error('Fetch error:', err);
        return [];
        }
    }

    private async handleCreateRoomSubmit(e: Event) {
    const input = document.querySelector<HTMLInputElement>('#room-name');
    if (!input) return;

    const roomName = input.value.trim();
    if (!roomName) {
        alert('Please enter a room name');
        return;
    }
    try {
        const res = await fetch('/api/create_room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName })
        });

        const data = await res.json();
        if (data.success) {
            showNotification(`Room "${roomName}" created successfully!`, 'success');
        } else {
            showNotification('Failed to create room: ' + data.error, 'error');
        }
    } catch (err) {
        showNotification('Error creating room', 'error');
    }
}

    private createRoomForm(): HTMLElement {
        const formContainer = createFormContainer({
            title: 'CREATE NEW ROOM',
            maxWidth: 'max-w-2xl',
            centered: true
        });

        const form = document.createElement('form');
        form.className = 'flex flex-col gap-6 max-w-md mx-auto';
        
        const fieldsDiv = document.createElement('div');
        fieldsDiv.className = 'space-y-4';
        
        const roomNameInput = createInputField({
            id: 'room-name',
            placeholder: 'ENTER ROOM NAME',
            colorTheme: 'pink',
            required: true
        });
        
        const createButton = createCyberButton({
            text: 'CREATE ROOM',
            type: 'gradient',
            fullWidth: true
        });
        (createButton as HTMLButtonElement).type = 'submit';
        
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'flex flex-col gap-4';
        buttonDiv.appendChild(createButton);
        
        fieldsDiv.appendChild(roomNameInput);
        form.appendChild(fieldsDiv);
        form.appendChild(buttonDiv);
        formContainer.appendChild(form);

        form.addEventListener('submit', (e) => this.handleCreateRoomSubmit(e));
        return formContainer;
    }

    private createRoomsList(rooms: any[]): HTMLElement {
        const listContainer = createFormContainer({
            title: 'AVAILABLE ROOMS',
            maxWidth: 'max-w-2xl',
            className: 'mt-8',
            centered: true
        });

        const list = document.createElement('div');
        list.className = 'space-y-4';

        if (rooms.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'text-center text-gray-400 font-tech';
            emptyMessage.textContent = 'NO ROOMS AVAILABLE';
            list.appendChild(emptyMessage);
        } else {
            rooms.forEach(room => {
                const roomItem = document.createElement('div');
                roomItem.className = 'bg-cyber-dark/50 border border-neon-cyan/30 p-4 hover:border-neon-cyan transition-colors';
                
                const roomContent = document.createElement('div');
                roomContent.className = 'flex justify-between items-center';
                
                const roomInfo = document.createElement('div');
                const roomTitle = document.createElement('h3');
                roomTitle.className = 'text-neon-pink font-cyber';
                roomTitle.textContent = room.name;
                
                const roomId = document.createElement('p');
                roomId.className = 'text-gray-400 font-tech text-sm';
                roomId.textContent = `ID: ${room.id}`;
                
                roomInfo.appendChild(roomTitle);
                roomInfo.appendChild(roomId);
                
                const joinButton = createCyberButton({
                    text: 'JOIN',
                    type: 'secondary',
                    size: 'sm'
                });
                
                roomContent.appendChild(roomInfo);
                roomContent.appendChild(joinButton);
                roomItem.appendChild(roomContent);
                list.appendChild(roomItem);
            });
        }
        
        listContainer.appendChild(list);
        return listContainer;
    }

    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();
        this.setupKeyHandlers();
        const sidebarHtml = await this.createSidebar();

        const onlinePongContent = document.createElement('div');
        onlinePongContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
        
        const backgroundLayers = createBackgroundLayers(onlineGame, 'Online Pong Background');
        const pageHeader = createPageHeader('ONLINE PONG', 'CHALLENGE THE NETWORK');
        
        onlinePongContent.innerHTML = sidebarHtml;
        
        const main = document.createElement('main');
        main.className = 'flex-1 flex flex-col';
        main.appendChild(backgroundLayers);
        main.appendChild(pageHeader);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center';
        contentArea.innerHTML = `
            <p class="text-gray-300 font-tech text-sm mb-8 text-center">CHOOSE YOUR BATTLEFIELD</p>
            <div class="w-full max-w-3xl mx-auto">
                <div id="room-form" class="w-full flex justify-center"></div>
                <div id="rooms-list" class="w-full flex justify-center"></div>
                <div id="pong-container" class="mt-4 cyber-border relative w-full flex-col items-center hidden"></div>
            </div>
        `;
        
        main.appendChild(contentArea);
        onlinePongContent.appendChild(main);

        this.container.appendChild(onlinePongContent);

        const roomForm = onlinePongContent.querySelector('#room-form');
        if (roomForm) {
            roomForm.appendChild(this.createRoomForm());
        }

        const rooms = await this.fetchRooms();
        const roomsList = onlinePongContent.querySelector('#rooms-list');
        if (roomsList) {
            roomsList.appendChild(this.createRoomsList(rooms));
        }

        await super.setupSidebarListeners();
        return this.container;
    }
}

export default OnlinePongPage;

