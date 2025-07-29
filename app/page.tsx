"use client"

import type React from "react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import "./login.css"
import { registeredUsers } from "@/lib/mock-db" // Import centralized storage
import { useRunAwayButton } from "@/hooks/use-run-away-button" // Import the new hook
import { ThemeToggle } from "@/components/ui/toggle"

interface LoginFormData {
  email: string
  password: string
}

interface LoginState {
  isLoading: boolean
  apiError: string | null
  isLoggedIn: boolean
}

interface FormErrors {
  email?: string
  password?: string
}

// Mock API function for login - now checks centralized storage
const mockLoginAPI = async (credentials: LoginFormData): Promise<{ success: boolean; message: string; user?: any }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const storedPassword = registeredUsers.get(credentials.email)

  if (storedPassword && storedPassword === credentials.password) {
    return {
      success: true,
      message: "Login successful",
      user: { email: credentials.email, name: "Registered User" }, // Generic name for registered users
    }
  } else {
    return {
      success: false,
      message: "Invalid email or password. Please sign up if you don't have an account.",
    }
  }
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" })
  const [loginState, setLoginState] = useState<LoginState>({
    isLoading: false,
    apiError: null,
    isLoggedIn: false,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [user, setUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Refs for focus management
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const apiErrorRef = useRef<HTMLDivElement>(null)
  const passwordToggleRef = useRef<HTMLButtonElement>(null)
  const appContainerRef = useRef<HTMLDivElement>(null) // Ref for the app container

  // Focusable elements for the focus trap (order matters for tab navigation)
  const focusableElements = [emailRef, passwordRef, passwordToggleRef, submitRef].filter(
    (ref) => ref.current,
  ) as React.RefObject<HTMLElement>[]

  const validateField = (name: keyof LoginFormData, value: string): string | undefined => {
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
      }
      // For login, we don't enforce complexity on client-side, only presence.
      // Complexity is enforced during signup.
    }
    return error
  }

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    if (loginState.apiError) {
      setLoginState((prev) => ({ ...prev, apiError: null }))
    }
  }

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    const emailError = validateField("email", formData.email)
    if (emailError) {
      newErrors.email = emailError
    }

    const passwordError = validateField("password", formData.password)
    if (passwordError) {
      newErrors.password = passwordError
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoginState((prev) => ({ ...prev, apiError: null }))
    const currentFormErrors = validateForm()
    setFormErrors(currentFormErrors)

    if (Object.keys(currentFormErrors).length > 0) {
      if (currentFormErrors.email && emailRef.current) {
        emailRef.current.focus()
      } else if (currentFormErrors.password && passwordRef.current) {
        passwordRef.current.focus()
      }
      return
    }

    setLoginState((prev) => ({ ...prev, isLoading: true }))

    try {
      const result = await mockLoginAPI(formData)

      if (result.success) {
        setLoginState((prev) => ({ ...prev, isLoading: false, isLoggedIn: true }))
        setUser(result.user)
      } else {
        setLoginState((prev) => ({
          ...prev,
          isLoading: false,
          apiError: result.message,
        }))
        setTimeout(() => apiErrorRef.current?.focus(), 100)
      }
    } catch (error) {
      setLoginState((prev) => ({
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

  const handleLogout = () => {
    setLoginState({ isLoading: false, apiError: null, isLoggedIn: false })
    setFormErrors({})
    setUser(null)
    setFormData({ email: "", password: "" })
    setTimeout(() => emailRef.current?.focus(), 100)
  }

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const isSubmitDisabled =
    loginState.isLoading ||
    Object.values(formErrors).some(Boolean) ||
    !formData.email.trim() ||
    !formData.password.trim()

  // Use the run away button hook
  const buttonStyle = useRunAwayButton({
    buttonRef: submitRef,
    containerRef: appContainerRef, // Pass the app container ref
    shouldRunAway: isSubmitDisabled,
  })

  if (loginState.isLoggedIn && user) {
    return (
      <div className="app-container">
        <main className="login-container">
          <div className="login-card success-card">
            <div className="success-icon" aria-hidden="true">
              ✓
            </div>
            <h1 className="login-title">Welcome Back!</h1>
            <div className="user-info">
              <p>Successfully logged in as:</p>
              <p className="user-email">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="logout-button" type="button">
              Logout
            </button>
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
            <h1 className="login-title" style={{ margin: 0 }}>Sign In</h1>
            <ThemeToggle />
          </div>
          {/* <p className="login-subtitle">Enter your credentials to access your account.</p> */}
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
                onBlur={() => setFormErrors((prev) => ({ ...prev, email: validateField("email", formData.email) }))}
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
                    setFormErrors((prev) => ({ ...prev, password: validateField("password", formData.password) }))
                  }
                  onKeyDown={(e) => handleKeyDown(e, 1)}
                  className={`form-input ${formErrors.password ? "input-error" : ""}`}
                  placeholder="Enter your password"
                  aria-describedby={formErrors.password ? "password-error" : undefined}
                  aria-invalid={formErrors.password ? "true" : "false"}
                  autoComplete="current-password"
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
              <a href="#" className="forgot-password-link">
                Forgot password?
              </a>
            </div>

            {loginState.apiError && (
              <div
                ref={apiErrorRef}
                id="api-error-message"
                className="error-message"
                role="alert"
                aria-live="polite"
                tabIndex={-1}
              >
                {loginState.apiError}
              </div>
            )}

            <button
              ref={submitRef}
              type="submit"
              disabled={isSubmitDisabled}
              onKeyDown={(e) => handleKeyDown(e, 2)}
              className={`login-button ${isSubmitDisabled ? "disabled" : ""} ${loginState.isLoading ? "loading" : ""}`}
              style={buttonStyle}
            >
              {loginState.isLoading ? (
                <>
                  <span className="loading-spinner" aria-hidden="true"></span>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          <div className="signup-prompt">
            Don't have an account?{" "}
            <Link href="/signup" className="signup-link" onClick={() => console.log("Sign Up Link clicked!")}>
              Sign Up
            </Link>
          </div>
          <div className="demo-info">
            <p>
              <strong>Demo for Login:</strong>
            </p>
            <p>Sign up first on the Sign Up page, then use those credentials here.</p>
            <p className="note">*Note: Users are stored temporarily in memory and will be lost on page refresh.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
