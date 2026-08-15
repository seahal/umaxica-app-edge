export class NextRequest extends Request {}

export class NextResponse extends Response {
  static next() {
    return new NextResponse(null, { status: 200 });
  }

  static json(data: unknown, init?: ResponseInit) {
    const response = Response.json(data, init);
    return new NextResponse(response.body, response);
  }
}

export async function connection() {}
