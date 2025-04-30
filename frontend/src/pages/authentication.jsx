import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/AuthContext";
import {
  Snackbar,
  Typography,
  LinearProgress,
  InputAdornment,
  IconButton,
  FormHelperText,
  Tooltip,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import InfoIcon from "@mui/icons-material/Info";

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [passwordStrength, setPasswordStrength] = React.useState(0);
  const [passwordFeedback, setPasswordFeedback] = React.useState("");

  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const theme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#7986cb",
      },
      secondary: {
        main: "#ff4081",
      },
      background: {
        default: "#303030",
        paper: "#424242",
      },
      strength: {
        weak: "#f44336",
        fair: "#ff9800",
        good: "#ffeb3b",
        strong: "#4caf50",
        veryStrong: "#2e7d32",
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
          },
          contained: {
            boxShadow: "none",
          },
        },
      },
    },
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordFeedback("");
      return;
    }

    const lengthScore = Math.min(password.length / 12, 1) * 25;

    let complexityScore = 0;
    if (/[a-z]/.test(password)) complexityScore += 10;
    if (/[A-Z]/.test(password)) complexityScore += 15;
    if (/[0-9]/.test(password)) complexityScore += 15;
    if (/[^a-zA-Z0-9]/.test(password)) complexityScore += 20;

    const commonPatterns = [
      /12345/,
      /qwerty/,
      /password/i,
      /admin/i,
      /welcome/i,
      /123456/,
      /abc123/i,
    ];
    const patternDeduction = commonPatterns.some((pattern) =>
      pattern.test(password)
    )
      ? 20
      : 0;

    const totalScore = Math.max(
      0,
      Math.min(100, lengthScore + complexityScore - patternDeduction)
    );

    let strength = 0;
    let feedback = "";

    if (totalScore < 20) {
      strength = 0;
      feedback = "Very weak: Use a longer password";
    } else if (totalScore < 40) {
      strength = 1;
      feedback = "Weak: Add numbers and uppercase letters";
    } else if (totalScore < 60) {
      strength = 2;
      feedback = "Fair: Consider adding special characters";
    } else if (totalScore < 80) {
      strength = 3;
      feedback = "Good: Your password is adequate";
    } else {
      strength = 4;
      feedback = "Very strong: Excellent password";
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  React.useEffect(() => {
    checkPasswordStrength(password);
  }, [password]);

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return theme.palette.strength.weak;
      case 1:
        return theme.palette.strength.weak;
      case 2:
        return theme.palette.strength.fair;
      case 3:
        return theme.palette.strength.good;
      case 4:
        return theme.palette.strength.strong;
      default:
        return theme.palette.strength.weak;
    }
  };

  let handleAuth = async (event) => {
    event.preventDefault();

    if (formState === 1 && passwordStrength < 2) {
      setError("Please use a stronger password");
      return;
    }

    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);

        if (result.success) {
          setMessage("Login successful!");
          setOpen(true);
        } else {
          setMessage("Invalid credentials");
          setOpen(true);
        }
      }

      if (formState === 1) {
        let result = await handleRegister(name, username, password);
        console.log(result);
        setUsername("");
        setPassword("");
        setMessage("Registration successful! Please login.");
        setOpen(true);
        setError("");

        setTimeout(() => {
          setFormState(0);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      let message = error.response?.data?.message || "Something went wrong";
      setError(message);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url('http://localhost:5173/5.webp')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
            filter: "brightness(0.7)",
          },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 3,
        }}
      >
        <CssBaseline />
        <Paper
          elevation={16}
          sx={{
            width: "100%",
            maxWidth: "450px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 4,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(48, 48, 48, 0.8)",
            borderRadius: 4,
            position: "relative",
            zIndex: 2,
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: "secondary.main",
              width: 56,
              height: 56,
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <LockOutlinedIcon fontSize="large" />
          </Avatar>

          <Typography
            component="h1"
            variant="h5"
            sx={{ mb: 3, fontWeight: 600 }}
          >
            {formState === 0 ? "Welcome Back" : "Create Account"}
          </Typography>

          <Box
            sx={{
              mb: 3,
              display: "flex",
              width: "100%",
              backgroundColor: "rgba(0,0,0,0.2)",
              borderRadius: 2,
              padding: 0.5,
            }}
          >
            <Button
              fullWidth
              variant={formState === 0 ? "contained" : "text"}
              onClick={() => setFormState(0)}
              sx={{
                py: 1,
                color: formState === 0 ? "" : "rgba(255,255,255,0.7)",
              }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant={formState === 1 ? "contained" : "text"}
              onClick={() => setFormState(1)}
              sx={{
                py: 1,
                color: formState === 1 ? "" : "rgba(255,255,255,0.7)",
              }}
            >
              Sign Up
            </Button>
          </Box>

          <Box
            component="form"
            noValidate
            onSubmit={handleAuth}
            sx={{ mt: 1, width: "100%" }}
          >
            {formState === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                variant="outlined"
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              value={username}
              autoFocus={formState !== 1}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              value={password}
              type={showPassword ? "text" : "password"}
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {formState === 1 && password && (
              <Box sx={{ mt: 1, width: "100%" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Password Strength:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: getPasswordStrengthColor(),
                        fontWeight: 500,
                        mr: 0.5,
                      }}
                    >
                      {passwordStrength === 0
                        ? "Very Weak"
                        : passwordStrength === 1
                        ? "Weak"
                        : passwordStrength === 2
                        ? "Fair"
                        : passwordStrength === 3
                        ? "Good"
                        : "Very Strong"}
                    </Typography>
                    <Tooltip title="A strong password should be at least 8 characters and include uppercase letters, lowercase letters, numbers, and special characters.">
                      <InfoIcon
                        sx={{
                          fontSize: 16,
                          color: "text.secondary",
                          cursor: "pointer",
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(passwordStrength + 1) * 20}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getPasswordStrengthColor(),
                    },
                  }}
                />
                <FormHelperText>{passwordFeedback}</FormHelperText>
              </Box>
            )}

            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              {formState === 0 ? "Sign In" : "Create Account"}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        message={message}
        sx={{
          "& .MuiSnackbarContent-root": {
            backgroundColor: "#424242",
            color: "#fff",
          },
        }}
      />
    </ThemeProvider>
  );
}
