# Page snapshot

```yaml
- generic [ref=e7]:
  - img "Impact Compendium Logo" [ref=e9]
  - generic [ref=e10]:
    - heading "Log in" [level=1] [ref=e11]
    - paragraph [ref=e12]: Enter your email and password to access your account
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]: Email address
      - textbox "Email address" [ref=e16]:
        - /placeholder: you@organization.org
    - generic [ref=e17]:
      - generic [ref=e18]: Password
      - generic [ref=e19]:
        - textbox "Password" [ref=e20]:
          - /placeholder: Enter your password
        - button "Show password" [ref=e21] [cursor=pointer]:
          - img [ref=e22]
    - generic [ref=e25]:
      - generic [ref=e26]:
        - checkbox "Remember me" [ref=e27]
        - generic [ref=e28]: Remember me
      - button "Forgot password?" [ref=e29] [cursor=pointer]
    - button "Login" [ref=e30] [cursor=pointer]
  - paragraph [ref=e32]:
    - text: Need help? Contact PRMS technical support at
    - link "prms-tech-support@cgiar.org" [ref=e33] [cursor=pointer]:
      - /url: mailto:prms-tech-support@cgiar.org
```