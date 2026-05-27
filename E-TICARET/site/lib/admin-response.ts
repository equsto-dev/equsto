export function adminOk<T extends Record<string, unknown>>(payload: T, status = 200) {
  return Response.json({ success: true, ...payload }, { status });
}

export function adminErr(error: string, status = 400) {
  return Response.json({ success: false, error }, { status });
}
