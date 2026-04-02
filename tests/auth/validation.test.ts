import { describe, expect, it } from "vitest";
import { validateSigninRequest, validateSignupRequest } from "@/lib/auth/validation";

describe("auth validation", () => {
  describe("validateSignupRequest", () => {
    it("normalizes and accepts a valid signup payload", () => {
      const result = validateSignupRequest({
        fullName: "  Sarah   Jenkins  ",
        email: "  SARAH@example.com ",
        companyName: "  Main   Street  Bakery ",
        password: "SecurePassword123",
        rememberMe: true,
      });

      expect(result).toEqual({
        success: true,
        data: {
          fullName: "Sarah Jenkins",
          email: "SARAH@example.com",
          emailNormalized: "sarah@example.com",
          companyName: "Main Street Bakery",
          password: "SecurePassword123",
          rememberMe: true,
        },
      });
    });

    it("returns field errors for invalid signup input", () => {
      const result = validateSignupRequest({
        fullName: "A",
        email: "invalid",
        companyName: "",
        password: "weak",
        rememberMe: "yes",
      });

      expect(result).toEqual({
        success: false,
        error: {
          error: "Please correct the highlighted fields.",
          code: "invalid_request",
          fieldErrors: {
            fullName: "Enter your full name.",
            email: "Enter a valid work email.",
            companyName: "Enter a valid company name.",
            password: "Password must be between 12 and 128 characters.",
            rememberMe: "Remember me must be true or false.",
          },
        },
      });
    });
  });

  describe("validateSigninRequest", () => {
    it("accepts a valid signin payload", () => {
      const result = validateSigninRequest({
        email: " Admin@Example.com ",
        password: "SecurePassword123",
      });

      expect(result).toEqual({
        success: true,
        data: {
          email: "Admin@Example.com",
          emailNormalized: "admin@example.com",
          password: "SecurePassword123",
          rememberMe: false,
        },
      });
    });

    it("accepts reserved yuxliu/YLjan2023!@ without email format", () => {
      const result = validateSigninRequest({
        email: "yuxliu",
        password: "YLjan2023!@",
      });

      expect(result).toEqual({
        success: true,
        data: {
          email: "yuxliu",
          emailNormalized: "yuxliu",
          password: "YLjan2023!@",
          rememberMe: false,
        },
      });
    });

    it("accepts reserved admin/admin without email format", () => {
      const result = validateSigninRequest({
        email: "admin",
        password: "admin",
      });

      expect(result).toEqual({
        success: true,
        data: {
          email: "admin",
          emailNormalized: "admin",
          password: "admin",
          rememberMe: false,
        },
      });
    });

    it("rejects invalid signin input", () => {
      const result = validateSigninRequest({
        email: "bad-email",
        password: "",
        rememberMe: "sometimes",
      });

      expect(result).toEqual({
        success: false,
        error: {
          error: "Please correct the highlighted fields.",
          code: "invalid_request",
          fieldErrors: {
            email: "Enter a valid work email.",
            password: "Enter your password.",
            rememberMe: "Remember me must be true or false.",
          },
        },
      });
    });
  });
});
