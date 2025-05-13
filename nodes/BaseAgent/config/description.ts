import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import { nodeProperties } from './properties';

export const nodeDescription: INodeTypeDescription = {
    displayName: 'Base Agent',
    name: 'baseAgent',
    icon: 'file:base.svg',
    group: ['blockchain'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with Base onchain AI agents',
    defaults: {
        name: 'Base Agent',
    },
    inputs: [
        {
            displayName: 'Input',
            maxConnections: 1,
            required: true,
            type: NodeConnectionType.Main,
        },
    ],
    outputs: [
        {
            displayName: 'Output',
            maxConnections: 1,
            type: NodeConnectionType.Main,
        },
    ],
    credentials: [
        {
            name: 'baseApi',
            required: true,
        },
    ],
    properties: nodeProperties,
}; 