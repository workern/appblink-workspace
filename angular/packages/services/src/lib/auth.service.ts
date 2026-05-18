import {
  Injectable,
  signal,
  computed,
  inject,
  resource,
  linkedSignal
} from '@angular/core';
import { User, UserAddress, Base } from '@workern/models';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  Firestore,
  collectionData,
  serverTimestamp,
  DocumentReference,
  CollectionReference,
  FieldValue
} from '@angular/fire/firestore';
import {
  Auth,
  GoogleAuthProvider,
  ApplicationVerifier,
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { GlobalManagerService } from './global-manager-service';
// This is a mock authentication service. In a real app, you'd use Firebase Auth, Auth0, etc.

@Injectable({ providedIn: 'root' })
export class AuthService {
  private db = inject(Firestore);
  gms = inject(GlobalManagerService);
  private auth = inject(Auth); // Placeholder for Firebase Auth service
  // FIX: Lazily inject FavoritesService to break circular dependency

  authInitialized = signal(false);
  isAuthenticated = computed(() => !!this.currentUser());
  stable = computed(() => this.isAuthenticated());
  isAuthenticated$ = toObservable(this.isAuthenticated);
  currentUser = signal<User | null>(null);
  addresses$ = resource({
    params: () => ({
      spaceRef: this.spaceRef(),
      currentUser: this.currentUser()
    }),
    loader: async ({ params }) => {
      if (params.spaceRef && params.currentUser && this.addressesRef()) {
        const addresses = await firstValueFrom(
          collectionData(this.addressesRef())
        );
        return addresses as UserAddress[];
      } else {
        return [];
      }
    }
  });
  addresses = computed(() => this.addresses$.value());
  selectedAddress = linkedSignal(() => {
    const addresses = this.addresses();
    if (addresses?.length) {
      return addresses?.length > 0 ? addresses[0] : null;
    } else {
      return null;
    }
  });

  isLoggedIn = computed(() => !!this.currentUser());
  userDocRef = computed(() => {
    if (this.currentUser()?.uid) {
      return doc(this.db, 'users', this.currentUser()?.uid as string);
    } else {
      return null;
    }
  });
  spaceRef = computed(() => {
    // New workspace path: apps/{appKeyName}/workspaces/{workspaceId}
    const workspaceId = this.gms.workspaceId();
    const appKeyName = this.gms.appKeyName();
    if (workspaceId && appKeyName) {
      return doc(this.db, `apps/${appKeyName}/workspaces/${workspaceId}`);
    } else {
      return null;
    }
  });
  addressesRef = computed(() => {
    if (this.spaceRef()) {
      return collection(this.spaceRef() as DocumentReference, 'addresses');
    } else {
      return null;
    }
  });
  uid = computed(() => this.currentUser()?.uid || null);
  spaceId = computed(() => {
    return this.gms.spaceId();
  });
  private loginDialogOpen = signal(false);
  private intendedRoute = signal<string | null>(null);

  private recaptchaVerifier?: RecaptchaVerifier;
  private confirmationResult?: ConfirmationResult;

  /** True when connectAuthEmulator() has been called (set by app.config.ts in dev). */
  private get isEmulatorActive(): boolean {
    return !!(this.auth as any).emulatorConfig;
  }

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      try {
        if (user) {
          this.currentUser.set({
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            mobile: user.phoneNumber,
            photoURL: user.photoURL
          });
          await this.loadUserFromFirestore(user.uid, user.photoURL || '');
        } else {
          this.currentUser.set(null);
          this.selectedAddress.set(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        this.currentUser.set(null);
      } finally {
        this.authInitialized.set(true);
      }
    });
    // Load user from local storage on initialization
  }

  // Firestore implementation: Helper to load user data from Firestore
  async loadUserFromFirestore(uid: string, photoURL: string): Promise<void> {
    try {
      const userAppDocRef = doc(this.db, 'users', uid);
      const docSnap = await getDoc(userAppDocRef);

      let userProfile: User;
      if (docSnap.exists()) {
        userProfile = docSnap.data() as User;
        userProfile.photoURL = photoURL;
      } else {
        // New user — build a base profile from Auth info and persist it
        const authUser = this.auth.currentUser;
        userProfile = {
          uid,
          name: authUser?.displayName ?? null,
          email: authUser?.email ?? null,
          mobile: authUser?.phoneNumber ?? '',
          photoURL: photoURL || authUser?.photoURL || null
        };
        await setDoc(userAppDocRef, userProfile);
      }

      this.currentUser.set(userProfile);
    } catch (e) {
      console.error('Error loading user data from Firestore:', e);
    }
  }

  async login(intendedRoute?: string): Promise<void> {
    // Store the intended route if provided
    if (intendedRoute) {
      this.intendedRoute.set(intendedRoute);
    }
    // Show the login dialog instead of directly logging in with Google
    this.loginDialogOpen.set(true);
  }

  async loginWithGoogleProvider(): Promise<void> {
    try {
      if (this.isEmulatorActive) {
        // signInWithPopup is unreliable against the Auth emulator — use a fake
        // credential. The emulator accepts any non-empty ID token string.
        const credential = GoogleAuthProvider.credential(
          JSON.stringify({
            sub: 'emulator-google-user',
            email: 'dev@example.com',
            email_verified: true,
            name: 'Dev User (Emulator)'
          })
        );
        await signInWithCredential(this.auth, credential);
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      await signInWithPopup(this.auth, provider);
    } catch (error) {
      console.error('Google login failed:', error);
      throw new Error('Google login failed. Please try again.');
    }
  }

  async signInAnonymously(): Promise<void> {
    try {
      const { signInAnonymously } = await import('@angular/fire/auth');
      await signInAnonymously(this.auth);
      console.log('User signed in anonymously');
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      throw new Error('Anonymous sign-in failed. Please try again.');
    }
  }

  async loginWithPhoneNumber(
    phoneNumber: string,
    recaptchaContainer: HTMLElement
  ): Promise<ConfirmationResult> {
    try {
      let verifier: ApplicationVerifier;

      if (this.isEmulatorActive) {
        // RecaptchaVerifier makes a real network call to google.com/recaptcha
        // which fails in emulator mode. The Auth emulator bypasses token
        // validation entirely — any non-empty string is accepted.
        verifier = {
          type: 'recaptcha',
          verify: () => Promise.resolve('fake-recaptcha-token-emulator')
        };
      } else {
        this.recaptchaVerifier = new RecaptchaVerifier(
          this.auth,
          recaptchaContainer,
          {
            size: 'invisible',
            callback: () => console.log('reCAPTCHA solved'),
            'expired-callback': () => console.log('reCAPTCHA expired')
          }
        );
        verifier = this.recaptchaVerifier;
      }

      // Send OTP — phoneNumber must already include the country code (e.g. +919876543210)
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        phoneNumber,
        verifier
      );

      return this.confirmationResult;
    } catch (error) {
      console.error('Error sending OTP:', error);
      this.cleanupRecaptcha();
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  async verifyOTP(otp: string): Promise<void> {
    if (!this.confirmationResult) {
      throw new Error(
        'No confirmation result available. Please request OTP first.'
      );
    }

    try {
      await this.confirmationResult.confirm(otp);
      this.cleanupRecaptcha();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Invalid OTP. Please try again.');
    }
  }

  private cleanupRecaptcha(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = undefined;
    }
    this.confirmationResult = undefined;
  }

  getLoginDialogOpen() {
    return this.loginDialogOpen;
  }

  setLoginDialogOpen(open: boolean) {
    this.loginDialogOpen.set(open);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    // In a real app, you would call firebase.auth().signOut()
    this.currentUser.set(null);
    this.selectedAddress.set(null);
  }

  setSelectedAddress(address: UserAddress): void {
    this.selectedAddress.set(address);
  }

  addAddress(address: UserAddress): void {
    this.currentUser.update((user) => {
      if (!user) return null;
      const newAddresses = [...(user.addresses || []), address];

      // Firestore implementation
      if (this.addressesRef()) {
        const docRef = doc(this.addressesRef() as CollectionReference);
        const firestoreAddress: UserAddress<Date | FieldValue> = {
          ...address,
          ...this.getBaseModelData(docRef.id)
        };

        setDoc(docRef, firestoreAddress).catch((e) =>
          console.error('Error adding address: ', e)
        );
      }

      return { ...user, addresses: newAddresses };
    });
  }

  getBaseModelData(id: string): Base<Date | FieldValue> {
    return {
      id: id,
      owner: {
        uid: this.currentUser()?.uid ?? '',
        name: this.currentUser()?.name ?? ''
      },
      space: { id: this.spaceId() },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  }

  async updateAddress(updatedAddress: UserAddress) {
    if (this.addresses() && this.addressesRef()) {
      this.currentUser.update((user) => {
        if (!user) return user;
        // This update logic requires a unique ID on the address object.
        const index = this.addresses()?.findIndex(
          (a) => a.id === this.addressToEdit()?.id
        );
        if (index > -1) {
          const newAddresses = [...this.addresses()];
          newAddresses[index] = updatedAddress;

          // Firestore implementation: Requires address to have an 'id' property from Firestore document ID
          if (updatedAddress.id) {
            const addressDocRef = doc(this.addressesRef(), updatedAddress.id);
            // The 'id' property should not be part of the data being updated in the document.

            updateDoc(addressDocRef, updatedAddress as any).catch((e) =>
              console.error('Error updating address: ', e)
            );
          }

          // If the updated address was the selected one, update the signal
          if (this.selectedAddress()?.id === this.addressToEdit()?.id) {
            this.selectedAddress.set(updatedAddress);
          }

          return { ...user, addresses: newAddresses };
        }
        return user;
      });
    }
  }

  deleteAddress(addressToDelete: UserAddress): void {
    this.currentUser.update((user) => {
      if (!user || !user.addresses) return user;
      const newAddresses = user.addresses.filter(
        (a) => a.id !== addressToDelete.id
      );

      // Firestore implementation: Requires address to have an 'id' property from Firestore document ID
      if (user && addressToDelete.id) {
        const addressDocRef = doc(
          this.addressesRef() as CollectionReference,
          addressToDelete.id
        );
        deleteDoc(addressDocRef).catch((e) =>
          console.error('Error deleting address: ', e)
        );
      }

      // If the deleted address was the selected one, clear it or pick another
      if (this.selectedAddress()?.id === addressToDelete.id) {
        this.selectedAddress.set(
          newAddresses.length > 0 ? newAddresses[0] : null
        );
      }

      return { ...user, addresses: newAddresses };
    });
  }

  // Helper to get the address being edited for the update logic
  private addressToEdit: () => UserAddress | null = () => null;
  setAddressToEdit(getter: () => UserAddress | null) {
    this.addressToEdit = getter;
  }

  getIntendedRoute(): string | null {
    return this.intendedRoute();
  }

  clearIntendedRoute(): void {
    this.intendedRoute.set(null);
  }

  async signUpWithEmail(
    email: string,
    password: string,
    name: string
  ): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Update the user's display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
      }

      console.log('Email signup successful:', userCredential.user);
    } catch (error) {
      console.error('Email signup failed:', error);
      throw this.getAuthErrorMessage(error);
    }
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('Email login successful:', userCredential.user);
    } catch (error) {
      console.error('Email login failed:', error);
      throw this.getAuthErrorMessage(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('Password reset email sent to:', email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw this.getAuthErrorMessage(error);
    }
  }

  private getAuthErrorMessage(error: any): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error(
          'This email is already registered. Please sign in instead.'
        );
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters long.');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address.');
      case 'auth/user-not-found':
        return new Error(
          'No account found with this email. Please sign up first.'
        );
      case 'auth/wrong-password':
        return new Error('Incorrect password. Please try again.');
      case 'auth/invalid-credential':
        return new Error(
          'Invalid email or password. Please check your credentials.'
        );
      case 'auth/too-many-requests':
        return new Error('Too many failed attempts. Please try again later.');
      default:
        return new Error('Authentication failed. Please try again.');
    }
  }
}
