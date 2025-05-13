import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import { nodeProperties } from './properties';

export const nodeDescription: INodeTypeDescription = {
    displayName: 'Base Agent',
    name: 'baseAgent',
    icon: 'file:base.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with Base on-chain AI agents',
    defaults: {
        name: 'Base Agent',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
        {
            name: 'privateKey',
            required: true,
        },
    ],
    properties: nodeProperties,
}; 