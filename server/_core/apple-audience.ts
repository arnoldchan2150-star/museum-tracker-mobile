export function getAppleAudiences(clientId: string, nodeEnv = process.env.NODE_ENV): string[] {
  const audiences = [clientId];
  if (nodeEnv === "development") audiences.push("host.exp.Exponent");
  return audiences;
}
