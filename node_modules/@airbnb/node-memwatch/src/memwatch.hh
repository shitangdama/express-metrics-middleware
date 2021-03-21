/*
 * 2012|lloyd|http://wtfpl.org
 */

#ifndef __MEMWATCH_HH
#define __MEMWATCH_HH

#include <node.h>
#include <nan.h>

namespace memwatch
{
    NAN_METHOD(upon_gc);
    NAN_METHOD(trigger_gc);
    NAN_GC_CALLBACK(before_gc);
    NAN_GC_CALLBACK(after_gc);
};

#endif
