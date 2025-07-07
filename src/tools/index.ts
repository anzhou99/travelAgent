import { Tool } from '../types';

const qweatherApiKey = ''; // 请在此处填写您的和风天气API密钥

const getCurrentDateTool: Tool = {
  schema: {
    type: 'function',
    function: {
      name: 'get_current_date',
      description: "用于获取当前日期, 返回格式为`当前日期是'YYYY-MM-DD'`",
      parameters: {},
    },
  },
  execute: function get_current_date() {
    // 获取当前日期和时间
    const currentDatetime = new Date();
    // 格式化当前日期和时间
    const formattedDate = currentDatetime.toLocaleString().split(' ')[0].replace(/\//g, '-');
    // 返回格式化后的当前时间
    return formattedDate;
  },
};

const getLocationIdTool: Tool = {
  schema: {
    type: 'function',
    function: {
      name: 'get_location_id',
      description: '将地点名称转换为查询天气所需的LocationId',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: "地点名称，如'九寨沟'",
          },
        },
        required: ['address'],
      },
    },
  },
  execute: async function ({ address }: { address: string }) {
    return new Promise((resolve, reject) => {
      fetch(`/qweatherapi/geo/v2/city/lookup?location=${address}&key=${qweatherApiKey}`)
        .then(res => res.json())
        .then(({ location }) => {
          resolve(location[0].id);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
};

const getWeatherTool: Tool = {
  schema: {
    type: 'function',
    function: {
      name: 'get_weather_by_location_id',
      description: '根据LocationId查询指定地点的天气信息',
      parameters: {
        type: 'object',
        properties: {
          locationId: {
            type: 'string',
            description: 'LocationId',
          },
          dates: {
            type: 'array',
            description: '从输入的旅行日期中提取的日期列表',
            items: {
              type: 'string',
              description: "日期, 格式为'YYYY-MM-DD'",
            },
          },
        },
        required: ['locationId', 'dates'],
      },
    },
  },
  execute: function ({ locationId, dates }: { locationId: string; dates: string[] }) {
    return new Promise((resolve, reject) => {
      fetch(`/qweatherapi/v7/weather/30d?location=${locationId}&key=${qweatherApiKey}`)
        .then(res => res.json())
        .then(({ daily }) => {
          const fcDates = daily.map((day: any) => day.fxDate);
          const weatherReport = dates.map((date: any) => {
            const dateIndex = fcDates.findIndex((fcDate: any) => fcDate === date);
            if (dateIndex !== -1) {
              return {
                date: date,
                weather: daily[dateIndex].textDay,
                high: daily[dateIndex].tempMax,
                low: daily[dateIndex].tempMin,
              };
            } else {
              return {
                date: date,
                weather: '无天气信息',
                high: '无天气信息',
                low: '无天气信息',
              };
            }
          });

          resolve(weatherReport);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
};

export default {
  getCurrentDateTool,
  getLocationIdTool,
  getWeatherTool,
};
