import { HttpService, } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { Observable, catchError, firstValueFrom } from 'rxjs';
import { CreateContentDto } from './dto/create-content.dto';
import { ParsedCompletionDto } from './dto/parsed-completion.dto';
import { ProcessedContentDto } from './dto/processed-content.dto';
import { RawContentDto } from './dto/raw-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) { }

  async create(createContentDto: CreateContentDto): Promise<'OK'> {
    const url = createContentDto.url;
    const rawData: RawContentDto = await this.getWebContent(url);

    const aiData = await this.getAiCompletion(rawData);

    const content: ProcessedContentDto = {
      url: url,
      title: rawData.title,
      text: rawData.text,
      summary: aiData.summary,
      categories: aiData.categories,
    }

    await this.saveWebContent(content);

    return 'OK';
  }

  findAll() {
    // Implement this method as needed.
  }

  findOne(id: number) {
    // Implement this method as needed.
  }

  async update(id: number, updateContentDto: UpdateContentDto) {
    // Implement this method as needed.
  }

  remove(id: number) {
    // Implement this method as needed.
  }

  private async getAiCompletion(data: RawContentDto): Promise<ParsedCompletionDto> {
    const userMessage = {
      'role': 'user',
      'content': `${this.configService.get<string>('OPENAI_INSTRUCTION')}\n\n${data.text}`
    }
    const systemMessage = {
      'role': 'system',
      'content': this.configService.get<string>('OPENAI_SYSTEM_PROMPT')
    }

    const messages = [systemMessage, userMessage];
    const options = {
      'model': this.configService.get<string>('OPENAI_MODEL'),
      'max_tokens': parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') as string),
      'temperature': parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') as string),
      'messages': messages,
      'stream': false,
      'stop': ["---"]
    }

    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${this.configService.get<string>('OPENAI_API_KEY')}`
    }

    const response = await this.getFirstValueFromObservable(this.httpService.post<unknown>(this.configService.get<string>('OPENAI_API_URL'), options, { headers }))

    // @ts-ignore
    const completion = response.data.choices[0].message.content

    const parsedData = JSON.parse(completion)

    return parsedData;
  }

  private async getWebContent(parameter: string): Promise<RawContentDto> {
    const url = `${this.configService.get<string>('GET_CONTENT_API_URL')}?url=${parameter}`;
    const headers = { [this.configService.get<string>('GET_CONTENT_API_KEY_HEADER')]: this.configService.get<string>('GET_CONTENT_API_KEY') };
    const response = await this.getFirstValueFromObservable(this.httpService.get<RawContentDto>(url, { headers }))

    return response.data;
  }

  private async saveWebContent(content: ProcessedContentDto): Promise<string> {
    const url = this.configService.get<string>('SAVE_CONTENT_API_URL');
    const headers = { [this.configService.get<string>('SAVE_CONTENT_API_KEY_HEADER')]: this.configService.get<string>('SAVE_CONTENT_API_KEY') };
    const { data } = await this.getFirstValueFromObservable(this.httpService.post<string>(url, content, { headers }))

    return data;
  }

  private async getFirstValueFromObservable<T>(obs$: Observable<AxiosResponse<T>>): Promise<AxiosResponse<T>> {
    return await firstValueFrom(
      obs$.pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
  }


}
