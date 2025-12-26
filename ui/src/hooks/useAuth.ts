import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';

export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		return onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});
	}, []);

	return { user, loading };
}
