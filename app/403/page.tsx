// Shown to a signed-in user whose email is not on the allowlist. Styling is
// intentionally minimal here; brand theming lands in the Shell and Theme
// milestone.
export default function ForbiddenPage() {
  return (
    <main style={{ maxWidth: "32rem", margin: "6rem auto", padding: "0 1.5rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Access not authorized</h1>
      <p style={{ marginTop: "1rem", color: "#555" }}>
        Your account is signed in but is not on the allowlist for this internal dashboard. Ask an
        administrator to add your FieldPulse email to the allowlist.
      </p>
    </main>
  );
}
