import { NgModule } from '@angular/core';
import { JsonSchemaFormComponent } from './json-schema-form.component';
import { JsonSchemaNodeComponent } from './json-schema-node.component';

@NgModule({
  imports: [JsonSchemaFormComponent, JsonSchemaNodeComponent],
  exports: [JsonSchemaFormComponent, JsonSchemaNodeComponent],
})
export class JsonSchemaFormModule {}
