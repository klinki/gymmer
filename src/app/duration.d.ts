declare namespace Intl {
  class DurationFormat {
    constructor(locale?: string, config?: any);

    format(duration: any): string;
  }
}
