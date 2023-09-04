export abstract class Transformer<Context, ToASTContext> {
  constructor(public name: string) { }

  abstract up(context: Context): Promise<void>
  abstract down(context: ToASTContext): Promise<void>
}
