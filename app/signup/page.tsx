"use client"

import type React from "react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import "../login.css"
import { registeredUsers } from "@/lib/mock-db" // Import centralized storage
import { useRunAwayButton } from "@/hooks/use-run-away-button" // Import the new hook
import { ThemeToggle } from "@/components/ui/toggle"

interface SignupFormData {
  email: string
  password: string
  confirmPassword: string
}

interface SignupState {
  isLoading: boolean
  apiError: string | null
  isSignedUp: boolean
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

interface PasswordCriteria {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}

// Mock API function for signup - now uses centralized storage
const mockSignupAPI = async (
  credentials: SignupFormData,
): Promise<{ success: boolean; message: string; user?: any }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Check if email already exists in the centralized storage
  if (registeredUsers.has(credentials.email)) {
    return { success: false, message: "Email already registered. Please sign in." }
  }

  // Simulate successful registration by storing in the centralized map
  registeredUsers.set(credentials.email, credentials.password)
  console.log("Registered users:", Array.from(registeredUsers.keys())) // For debugging
  return {
    success: true,
    message: "Account created successfully! Please sign in.",
    user: { email: credentials.email },
  }
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [signupState, setSignupState] = useState<SignupState>({
    isLoading: false,
    apiError: null,
    isSignedUp: false,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordCriteriaMet, setPasswordCriteriaMet] = useState<PasswordCriteria>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  })

  // Refs for focus management
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const apiErrorRef = useRef<HTMLDivElement>(null)
  const passwordToggleRef = useRef<HTMLButtonElement>(null)
  const confirmPasswordToggleRef = useRef<HTMLButtonElement>(null)
  const appContainerRef = useRef<HTMLDivElement>(null) // Ref for the app container

  // Focusable elements for the focus trap (order matters for tab navigation)
  const focusableElements = [
    emailRef,
    passwordRef,
    passwordToggleRef,
    confirmPasswordRef,
    confirmPasswordToggleRef,
    submitRef,
  ].filter((ref) => ref.current) as React.RefObject<HTMLElement>[]

  const validateField = (
    name: keyof SignupFormData,
    value: string,
    allFormData: SignupFormData,
  ): string | undefined => {
    let error: string | undefined
    if (name === "email") {
      if (!value.trim()) {
        error = "Email is required."
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        error = "Invalid email format."
      }
    } else if (name === "password") {
      if (!value.trim()) {
        error = "Password is required."
      } else if (value.length < 8) {
        error = "Password must be at least 8 characters long."
      } else if (!/[A-Z]/.test(value)) {
        error = "Password must contain at least one uppercase letter."
      } else if (!/[a-z]/.test(value)) {
        error = "Password must contain at least one lowercase letter."
      } else if (!/[0-9]/.test(value)) {
        error = "Password must contain at least one number."
      } else if (!/[^A-Za-z0-9]/.test(value)) {
        error = "Password must contain at least one special character."
      }
    } else if (name === "confirmPassword") {
      if (!value.trim()) {
        error = "Confirm password is required."
      } else if (value !== allFormData.password) {
        error = "Passwords do not match."
      }
    }
    return error
  }

  const checkPasswordCriteria = (password: string) => {
    setPasswordCriteriaMet({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    })
  }

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    if (signupState.apiError) {
      setSignupState((prev) => ({ ...prev, apiError: null }))
    }

    if (field === "password") {
      checkPasswordCriteria(value)
      // Also re-validate confirm password if password changes
      if (formData.confirmPassword.trim()) {
        setFormErrors((prev) => ({
          ...prev,
          confirmPassword: validateField("confirmPassword", formData.confirmPassword, { ...formData, password: value }),
        }))
      }
    } else if (field === "confirmPassword") {
      // Re-validate confirm password when it changes
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword: validateField("confirmPassword", value, formData),
      }))
    }
  }

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    const emailError = validateField("email", formData.email, formData)
    if (emailError) newErrors.email = emailError

    const passwordError = validateField("password", formData.password, formData)
    if (passwordError) newErrors.password = passwordError

    const confirmPasswordError = validateField("confirmPassword", formData.confirmPassword, formData)
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSignupState((prev) => ({ ...prev, apiError: null }))
    const currentFormErrors = validateForm()
    setFormErrors(currentFormErrors)

    if (Object.keys(currentFormErrors).length > 0) {
      if (currentFormErrors.email && emailRef.current) {
        emailRef.current.focus()
      } else if (currentFormErrors.password && passwordRef.current) {
        passwordRef.current.focus()
      } else if (currentFormErrors.confirmPassword && confirmPasswordRef.current) {
        confirmPasswordRef.current.focus()
      }
      return
    }

    setSignupState((prev) => ({ ...prev, isLoading: true }))

    try {
      const result = await mockSignupAPI(formData)

      if (result.success) {
        setSignupState((prev) => ({ ...prev, isLoading: false, isSignedUp: true }))
      } else {
        setSignupState((prev) => ({
          ...prev,
          isLoading: false,
          apiError: result.message,
        }))
        setTimeout(() => apiErrorRef.current?.focus(), 100)
      }
    } catch (error) {
      setSignupState((prev) => ({
        ...prev,
        isLoading: false,
        apiError: "Network error. Please try again.",
      }))
      setTimeout(() => apiErrorRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === "Tab") {
      if (e.shiftKey && currentIndex === 0) {
        e.preventDefault()
        focusableElements[focusableElements.length - 1].current?.focus()
      } else if (!e.shiftKey && currentIndex === focusableElements.length - 1) {
        e.preventDefault()
        focusableElements[0].current?.focus()
      }
    }
  }

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const isSubmitDisabled =
    signupState.isLoading ||
    Object.values(formErrors).some(Boolean) ||
    !formData.email.trim() ||
    !formData.password.trim() ||
    !formData.confirmPassword.trim()

  // Use the run away button hook
  const buttonStyle = useRunAwayButton({
    buttonRef: submitRef,
    containerRef: appContainerRef, // Pass the app container ref
    shouldRunAway: isSubmitDisabled,
  })

  if (signupState.isSignedUp) {
    return (
      <div className="app-container">
        <main className="login-container">
          <div className="login-card success-card">
            <div className="success-icon" aria-hidden="true">
              ✓
            </div>
            <h1 className="login-title">Account Created!</h1>
            <p className="login-subtitle">Your account has been successfully created.</p>
            <Link href="/" className="logout-button" role="button">
              Go to Sign In
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div ref={appContainerRef} className="app-container">
      {" "}
      {/* Attach ref to the app container */}
      <main className="login-container">
        <div className="login-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h1 className="login-title" style={{ margin: 0 }}>Sign Up</h1>
            <ThemeToggle />
          </div>
          {/* <p className="login-subtitle">Create your account to get started</p> */}

          {/* API error message at the top, prominent */}
          {signupState.apiError && (
            <div
              ref={apiErrorRef}
              id="api-error-message"
              className="error-message global-error"
              role="alert"
              aria-live="polite"
              tabIndex={-1}
              style={{ marginBottom: '1rem', padding: '0.75rem', background: '#ffeaea', color: '#b00020', borderRadius: '6px', fontWeight: 500, border: '1px solid #ffb3b3' }}
            >
              {signupState.apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() =>
                  setFormErrors((prev) => ({ ...prev, email: validateField("email", formData.email, formData) }))
                }
                onKeyDown={(e) => handleKeyDown(e, 0)}
                className={`form-input ${formErrors.email ? "input-error" : ""}`}
                placeholder="Enter your email"
                aria-describedby={formErrors.email ? "email-error" : undefined}
                aria-invalid={formErrors.email ? "true" : "false"}
                autoComplete="email"
                required
              />
              {formErrors.email && (
                <div id="email-error" className="field-error" role="alert" aria-live="polite">
                  {formErrors.email}
                </div>
              )}
            </div>

            <div className="form-group password-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onBlur={() =>
                    setFormErrors((prev) => ({
                      ...prev,
                      password: validateField("password", formData.password, formData),
                    }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, 1)}
                  className={`form-input ${formErrors.password ? "input-error" : ""}`}
                  placeholder="Create your password"
                  aria-describedby={
                    formErrors.password ? "password-error password-criteria-list" : "password-criteria-list"
                  }
                  aria-invalid={formErrors.password ? "true" : "false"}
                  autoComplete="new-password"
                  required
                />
                <button
                  ref={passwordToggleRef}
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="password-toggle-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="password"
                  onKeyDown={(e) => handleKeyDown(e, 2)}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M6 18L18 6" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <div id="password-error" className="field-error" role="alert" aria-live="polite">
                  {formErrors.password}
                </div>
              )}
              <ul id="password-criteria-list" className="password-checklist" aria-live="polite">
                <li className={passwordCriteriaMet.minLength ? "met" : "unmet"}>
                  {passwordCriteriaMet.minLength ? "✓" : "✗"} At least 8 characters
                </li>
                <li className={passwordCriteriaMet.hasUppercase ? "met" : "unmet"}>
                  {passwordCriteriaMet.hasUppercase ? "✓" : "✗"} At least one uppercase letter
                </li>
                <li className={passwordCriteriaMet.hasLowercase ? "met" : "unmet"}>
                  {passwordCriteriaMet.hasLowercase ? "✓" : "✗"} At least one lowercase letter
                </li>
                <li className={passwordCriteriaMet.hasNumber ? "met" : "unmet"}>
                  {passwordCriteriaMet.hasNumber ? "✓" : "✗"} At least one number
                </li>
                <li className={passwordCriteriaMet.hasSpecialChar ? "met" : "unmet"}>
                  {passwordCriteriaMet.hasSpecialChar ? "✓" : "✗"} At least one special character
                </li>
              </ul>
            </div>

            <div className="form-group password-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  onBlur={() =>
                    setFormErrors((prev) => ({
                      ...prev,
                      confirmPassword: validateField("confirmPassword", formData.confirmPassword, formData),
                    }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, 3)}
                  className={`form-input ${formErrors.confirmPassword ? "input-error" : ""}`}
                  placeholder="Confirm your password"
                  aria-describedby={formErrors.confirmPassword ? "confirm-password-error" : undefined}
                  aria-invalid={formErrors.confirmPassword ? "true" : "false"}
                  autoComplete="new-password"
                  required
                />
                <button
                  ref={confirmPasswordToggleRef}
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="password-toggle-button"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-controls="confirmPassword"
                  onKeyDown={(e) => handleKeyDown(e, 4)}
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M6 18L18 6" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <div id="confirm-password-error" className="field-error" role="alert" aria-live="polite">
                  {formErrors.confirmPassword}
                </div>
              )}
            </div>

            <button
              ref={submitRef}
              type="submit"
              disabled={isSubmitDisabled}
              onKeyDown={(e) => handleKeyDown(e, 5)}
              className={`login-button ${isSubmitDisabled ? "disabled" : ""} ${signupState.isLoading ? "loading" : ""}`}
              style={buttonStyle} // Apply the dynamic style
            >
              {signupState.isLoading ? (
                <>
                  <span className="loading-spinner" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
            {/* Removed button help message */}
          </form>

          <div className="signup-prompt">
            Already have an account?{" "}
            <Link href="/" className="signup-link" onClick={() => console.log("Sign In Link clicked!")}>
              Sign In
            </Link>
          </div>

          <div className="demo-info">
            <p>
              <strong>Demo for Sign Up:</strong>
            </p>
            <p>Create any valid email and a password that meets the criteria.</p>
            <p className="note">
              *Note: Users created here are stored temporarily in memory and will be lost on page refresh.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
