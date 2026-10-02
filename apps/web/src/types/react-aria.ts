import React from 'react';

export interface SortDescriptor {
  column?: React.Key;
  direction?: 'ascending' | 'descending';
}
