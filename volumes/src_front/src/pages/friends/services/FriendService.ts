type Friend = {
	id: number;
	username: string;
	online: boolean;
	avatar_url: string;
};

type FriendRequest = {
	id: number;
	username: string;
	avatar_url: string;
	senderId?: number;
};

class FriendService {
	static async fetchFriendsList(): Promise<Friend[]> {
		const response = await fetch('/api/friends', { credentials: 'include' });
		if (!response.ok) return [];
		const data = await response.json();
		return data.friends || [];
	}

	static async fetchFriendRequests(): Promise<FriendRequest[]> {
		const response = await fetch('/api/friend_requests', { credentials: 'include' });
		if (!response.ok) return [];
		const data = await response.json();
		return data.requests || [];
	}

	static async addFriend(userId: number): Promise<boolean> {
		const response = await fetch(`/api/add_friend/${userId}`, { method: 'GET', credentials: 'include' });
		return response.ok;
	}

	static async removeFriend(userId: number): Promise<boolean> {
		const response = await fetch(`/api/remove_friend/${userId}`, { method: 'GET', credentials: 'include' });
		return response.ok;
	}

	static async blockUser(userId: number): Promise<boolean> {
		const response = await fetch(`/api/users/${userId}/block`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
			credentials: 'include',
		});
		return response.ok;
	}

	static async unblockUser(userId: number): Promise<boolean> {
		const response = await fetch(`/api/unblock_user/${userId}`, { method: 'GET', credentials: 'include' });
		return response.ok;
	}

	static async acceptFriendRequest(userId: number): Promise<boolean> {
		try {
			const response = await fetch(`/api/accept_friend/${userId}`, { method: 'GET', credentials: 'include' });
			const data = await response.json();
			return !!data.success;
		} catch {
			return false;
		}
	}

	static async declineFriendRequest(userId: number): Promise<boolean> {
		try {
			const response = await fetch(`/api/decline_friend/${userId}`, { method: 'GET', credentials: 'include' });
			const data = await response.json();
			return !!data.success;
		} catch {
			return false;
		}
	}
}

export type { Friend, FriendRequest };
export default FriendService;
