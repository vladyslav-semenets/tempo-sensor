import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import {
	signInWithPopup,
	signInWithCredential,
	GoogleAuthProvider,
	onAuthStateChanged,
	signOut,
	type User,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export function useCapacitorAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		return onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
			setLoading(false);
		});
	}, []);

	const handleGoogleLogin = async () => {
		setLoading(true);
		setError(null);
		try {
			if (Capacitor.isNativePlatform()) {
				try {
					const result = await FirebaseAuthentication.signInWithGoogle();

					if (!result.credential?.idToken) {
						throw new Error('No ID token returned from native sign-in');
					}

					const credential = GoogleAuthProvider.credential(result.credential.idToken);

					const userCredential = await signInWithCredential(auth, credential);
					return userCredential.user;
				} catch (nativeError) {
					console.error('Native sign in failed:', nativeError);
					throw nativeError;
				}
			} else {
				const provider = new GoogleAuthProvider();
				const result = await signInWithPopup(auth, provider);
				return result.user;
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
			setError(errorMessage);
			console.error('Sign in error:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);
		setError(null);
		try {
			await signOut(auth);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Logout failed';
			setError(errorMessage);
			console.error('Logout error:', err);
		} finally {
			setLoading(false);
		}
	};

	return {
		user,
		loading,
		error,
		handleGoogleLogin,
		handleLogout,
	};
}
